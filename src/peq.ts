import type { Band } from "./main.ts";
import {isExperimentalFreeDspActive} from './freedsp/graphicalRam.ts';
import {nativePeakFloat} from '../scripts/freedsp/ram-semantics.mjs';

/**
 * CONFIG & CONSTANTS FOR PEQ CANVAS
 */
const CONFIG = {
	minFreq: 20,
	maxFreq: 20000,
	minGain: -12,
	gainRange: 12,
	padding: 40,
};

/**
 * STATE MANAGEMENT
 */
let localBands: Band[] = [];
let selectedIndex: number | null = null;
let draggingIndex: number | null = null;
let hoveredIndex: number | null = null;
let onUpdateCallback:
	| ((index: number, key: string, value: number | string | boolean) => void)
	| null = null;

// DOM Elements
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

/**
 * MATHEMATICS: Frequency to X Coordinate (Logarithmic Scale)
 */
function freqToX(freq: number, width: number) {
	const logMin = Math.log10(CONFIG.minFreq);
	const logMax = Math.log10(CONFIG.maxFreq);
	const logFreq = Math.log10(Math.max(freq, CONFIG.minFreq));
	return (
		CONFIG.padding +
		((logFreq - logMin) / (logMax - logMin)) * (width - 2 * CONFIG.padding)
	);
}

/**
 * MATHEMATICS: X Coordinate to Frequency (Logarithmic Scale)
 */
function xToFreq(x: number, width: number) {
	const logMin = Math.log10(CONFIG.minFreq);
	const logMax = Math.log10(CONFIG.maxFreq);
	const ratio = (x - CONFIG.padding) / (width - 2 * CONFIG.padding);
	return 10 ** (logMin + ratio * (logMax - logMin));
}

/**
 * MATHEMATICS: Gain to Y Coordinate
 */
function gainToY(gain: number, height: number) {
	return height / 2 - (gain / CONFIG.gainRange) * (height / 2 - CONFIG.padding);
}

/**
 * MATHEMATICS: Y Coordinate to Gain
 */
function yToGain(y: number, height: number) {
	return (-(y - height / 2) * CONFIG.gainRange) / (height / 2 - CONFIG.padding);
}

/**
 * Calculate Biquad Filter Coefficients (RBJ Audio EQ Cookbook)
 */
function calculateBiquad(band: Band, sampleRate: number = 48000) {
	if (!band.enabled) {
		return { b0: 1, b1: 0, b2: 0, a1: 0, a2: 0 };
	}
	// FreeDSP graph uses the native float model; 48k is visual only, never a hardware rate fallback.
	if(isExperimentalFreeDspActive() && band.type==='PK' && [band.freq,band.gain,band.q].every(Number.isFinite) && band.q>0){
		const [b0,b1,b2,p1,p2]=nativePeakFloat({frequency:band.freq,gainDb:band.gain,q:band.q,sampleHz:sampleRate}).coefficients;
		return {b0,b1,b2,a1:-p1,a2:-p2};
	}

	const w0 = (2 * Math.PI * band.freq) / sampleRate;
	const alpha = Math.sin(w0) / (2 * band.q);
	const A = 10 ** (band.gain / 40);
	const cosw = Math.cos(w0);

	let b0, b1, b2, a0, a1, a2;

	switch (band.type) {
		case "NOTCH":
			b0 = 1;
			b1 = -2 * cosw;
			b2 = 1;
			a0 = 1 + alpha;
			a1 = -2 * cosw;
			a2 = 1 - alpha;
			break;
		case "PK": // Peaking EQ
			b0 = 1 + alpha * A;
			b1 = -2 * cosw;
			b2 = 1 - alpha * A;
			a0 = 1 + alpha / A;
			a1 = -2 * cosw;
			a2 = 1 - alpha / A;
			break;
		case "LSQ": {
			// Low Shelf
			const sa = 2 * Math.sqrt(A) * alpha;
			b0 = A * (A + 1 - (A - 1) * cosw + sa);
			b1 = 2 * A * (A - 1 - (A + 1) * cosw);
			b2 = A * (A + 1 - (A - 1) * cosw - sa);
			a0 = A + 1 + (A - 1) * cosw + sa;
			a1 = -2 * (A - 1 + (A + 1) * cosw);
			a2 = A + 1 + (A - 1) * cosw - sa;
			break;
		}
		case "HSQ": {
			// High Shelf
			const sb = 2 * Math.sqrt(A) * alpha;
			b0 = A * (A + 1 + (A - 1) * cosw + sb);
			b1 = -2 * A * (A - 1 + (A + 1) * cosw);
			b2 = A * (A + 1 + (A - 1) * cosw - sb);
			a0 = A + 1 - (A - 1) * cosw + sb;
			a1 = 2 * (A - 1 - (A + 1) * cosw);
			a2 = A + 1 - (A - 1) * cosw - sb;
			break;
		}
		default:
			b0 = 1; b1 = 0; b2 = 0;
			a0 = 1; a1 = 0; a2 = 0;
			break;
	}

	return {
		b0: b0 / a0,
		b1: b1 / a0,
		b2: b2 / a0,
		a1: a1 / a0,
		a2: a2 / a0,
	};
}

/**
 * Compute Magnitude response at a given frequency
 */
function getMagnitude(
	freq: number,
	coeffsList: any[],
	sampleRate: number = 48000,
) {
	const w = (2 * Math.PI * freq) / sampleRate;
	const cos1 = Math.cos(w);
	const cos2 = Math.cos(2 * w);
	const sin1 = Math.sin(w);
	const sin2 = Math.sin(2 * w);

	let totalDb = 0;

	coeffsList.forEach((c) => {
		const numRe = c.b0 + c.b1 * cos1 + c.b2 * cos2;
		const numIm = -(c.b1 * sin1 + c.b2 * sin2);
		const denRe = 1 + c.a1 * cos1 + c.a2 * cos2;
		const denIm = -(c.a1 * sin1 + c.a2 * sin2);

		const magSq =
			(numRe * numRe + numIm * numIm) / (denRe * denRe + denIm * denIm);
		totalDb += 10 * Math.log10(magSq);
	});

	return totalDb;
}

/**
 * Handle canvas resize events
 */
export function resizeCanvas() {
	if (!canvas || !ctx) return;
	const parent = canvas.parentElement;
	if (!parent) return;

	const rect = canvas.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;

	canvas.width = Math.round(rect.width * dpr);
	canvas.height = Math.round(rect.height * dpr);

	ctx.scale(dpr, dpr);

	(canvas as any).logicalWidth = rect.width;
	(canvas as any).logicalHeight = rect.height;

	draw();
}

/**
 * Draw logarithmic grid, frequency lines and gain labels
 */
function drawGrid(c: CanvasRenderingContext2D, width: number, height: number) {
	// Background grid lines style
	c.strokeStyle = "rgba(255, 255, 255, 0.04)";
	c.lineWidth = 1;
	c.font = "10px 'Outfit', sans-serif";
	c.fillStyle = "rgba(255, 255, 255, 0.4)";
	c.textAlign = "right";

	// Horizontal Gain lines
	for (let g = -CONFIG.gainRange; g <= CONFIG.gainRange; g += 6) {
		const y = gainToY(g, height);
		c.beginPath();
		c.moveTo(CONFIG.padding, y);
		c.lineTo(width - CONFIG.padding, y);
		c.stroke();
		if (g !== 0) c.fillText(`${g} dB`, CONFIG.padding - 8, y + 3);
	}

	// Mid-zero reference line
	const zeroY = gainToY(0, height);
	c.strokeStyle = "rgba(139, 92, 246, 0.2)"; // Deep violet reference line
	c.lineWidth = 1.5;
	c.beginPath();
	c.moveTo(CONFIG.padding, zeroY);
	c.lineTo(width - CONFIG.padding, zeroY);
	c.stroke();

	// Logarithmic frequency lines
	const freqs = [30, 60, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
	c.strokeStyle = "rgba(255, 255, 255, 0.04)";
	c.lineWidth = 1;
	c.textAlign = "center";

	freqs.forEach((f) => {
		const x = freqToX(f, width);
		c.beginPath();
		c.moveTo(x, CONFIG.padding);
		c.lineTo(x, height - CONFIG.padding);
		c.stroke();
		c.fillText(
			f >= 1000 ? `${f / 1000}k` : f.toString(),
			x,
			height - CONFIG.padding + 16,
		);
	});
}

/**
 * Trace out the cumulative EQ filter curve on the canvas
 */
function drawCurve(c: CanvasRenderingContext2D, width: number, height: number) {
	const activeCoeffs = localBands.map((b) => calculateBiquad(b));
	const endX = width - CONFIG.padding;
	const startX = CONFIG.padding;

	const bassTilt = (window as any).getBassTiltState?.() || 0;
	const trebleTilt = (window as any).getTrebleTiltState?.() || 0;

	// 1. Draw tilt-only dashed reference curve
	if (bassTilt !== 0 || trebleTilt !== 0) {
		c.beginPath();
		c.strokeStyle = "rgba(139, 92, 246, 0.4)"; // Subtle semi-transparent violet
		c.lineWidth = 1.5;
		c.setLineDash([4, 4]);
		
		for (let i = 0; i <= endX - startX; i++) {
			const x = startX + i;
			const freq = xToFreq(x, width);
			const tiltGain = (window as any).getTiltGainAtFreq?.(freq) || 0;
			const y = gainToY(tiltGain, height);
			
			if (i === 0) c.moveTo(x, y);
			else c.lineTo(x, y);
		}
		c.stroke();
		c.setLineDash([]); // Reset dashed state
		
		// Draw text legend/tag on the canvas
		c.fillStyle = "rgba(255, 255, 255, 0.5)";
		c.font = "11px 'Outfit', sans-serif";
		c.textAlign = "left";
		c.fillText(
			`Tilt: Bass ${bassTilt >= 0 ? "+" : ""}${bassTilt.toFixed(1)} dB / Treble ${trebleTilt >= 0 ? "+" : ""}${trebleTilt.toFixed(1)} dB`,
			CONFIG.padding + 10,
			CONFIG.padding + 20
		);
	}

	// 2. Draw compared curve if A/B comparison is active
	const comparedBands = (window as any).getComparedEqState?.() as Band[] | null;
	if (comparedBands) {
		const comparedCoeffs = comparedBands.map((b) => calculateBiquad(b));
		c.beginPath();
		c.strokeStyle = "rgba(255, 255, 255, 0.22)"; // Faint, semi-transparent white/grey
		c.lineWidth = 2.0;
		c.setLineDash([5, 5]); // Dashed line
		
		for (let i = 0; i <= endX - startX; i++) {
			const x = startX + i;
			const freq = xToFreq(x, width);
			const tiltGain = (window as any).getTiltGainAtFreq?.(freq) || 0;
			const totalGain = getMagnitude(freq, comparedCoeffs) + tiltGain;
			const y = gainToY(totalGain, height);
			
			if (i === 0) c.moveTo(x, y);
			else c.lineTo(x, y);
		}
		c.stroke();
		c.setLineDash([]); // Reset dashed state
	}

	// 3. Draw combined curve (with active EQ + virtual tilt filters)
	c.beginPath();
	
	// Create a beautiful glowing gradient for the EQ curve
	const gradient = c.createLinearGradient(CONFIG.padding, 0, width - CONFIG.padding, 0);
	gradient.addColorStop(0, "#a78bfa"); // Neon violet-purple
	gradient.addColorStop(0.5, "#ec4899"); // Magenta/Pink aura
	gradient.addColorStop(1, "#8b5cf6"); // Deep violet
	
	c.strokeStyle = gradient;
	c.lineWidth = 3.5;
	c.shadowBlur = 15;
	c.shadowColor = "rgba(167, 139, 250, 0.5)"; // Aura glow

	for (let i = 0; i <= endX - startX; i++) {
		const x = startX + i;
		const freq = xToFreq(x, width);
		const tiltGain = (window as any).getTiltGainAtFreq?.(freq) || 0;
		const totalGain = getMagnitude(freq, activeCoeffs) + tiltGain;
		const y = gainToY(totalGain, height);

		if (i === 0) c.moveTo(x, y);
		else c.lineTo(x, y);
	}
	c.stroke();
	c.shadowBlur = 0; // Reset shadow
}

/**
 * Draw interactive EQ band handles on the canvas
 */
function drawHandles(
	c: CanvasRenderingContext2D,
	width: number,
	height: number,
) {
	localBands.forEach((band) => {
		const x = freqToX(band.freq, width);
		const y = gainToY(band.gain, height);
		const isSelected = band.index === selectedIndex;
		const isDisabled = !band.enabled;

		// 1. Draw outer glowing ring for selected band
		if (isSelected) {
			c.beginPath();
			c.arc(x, y, 12, 0, 2 * Math.PI);
			c.fillStyle = "rgba(167, 139, 250, 0.25)";
			c.strokeStyle = "rgba(236, 72, 153, 0.5)";
			c.lineWidth = 1;
			c.fill();
			c.stroke();
		}

		// 2. Draw core handle
		c.beginPath();
		c.arc(x, y, isSelected ? 8 : 6, 0, 2 * Math.PI);

		if (isDisabled) {
			c.fillStyle = isSelected ? "rgba(239, 68, 68, 0.5)" : "rgba(100, 116, 139, 0.4)";
			c.strokeStyle = "rgba(255, 255, 255, 0.1)";
		} else {
			c.fillStyle = isSelected ? "#ffffff" : "#ec4899"; // White when selected, magenta when active
			c.strokeStyle = isSelected ? "#ec4899" : "#8b5cf6"; // Violet borders
		}

		c.lineWidth = 2.5;
		c.fill();
		c.stroke();

		// 3. Draw band number label above handle
		c.fillStyle = isSelected ? "#ffffff" : "rgba(255, 255, 255, 0.6)";
		c.font = "bold 9px 'Outfit', sans-serif";
		c.textAlign = "center";
		c.fillText((band.index + 1).toString(), x, y - (isSelected ? 14 : 11));
	});
}

/**
 * Draw a rounded rectangle on canvas
 */
function drawRoundedRect(
	c: CanvasRenderingContext2D,
	x: number,
	y: number,
	width: number,
	height: number,
	radius: number,
	fill: string,
	stroke: string,
	strokeWidth: number,
) {
	c.beginPath();
	c.moveTo(x + radius, y);
	c.lineTo(x + width - radius, y);
	c.quadraticCurveTo(x + width, y, x + width, y + radius);
	c.lineTo(x + width, y + height - radius);
	c.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
	c.lineTo(x + radius, y + height);
	c.quadraticCurveTo(x, y + height, x, y + height - radius);
	c.lineTo(x, y + radius);
	c.quadraticCurveTo(x, y, x + radius, y);
	c.closePath();
	c.fillStyle = fill;
	c.fill();
	if (strokeWidth > 0) {
		c.strokeStyle = stroke;
		c.lineWidth = strokeWidth;
		c.stroke();
	}
}

/**
 * Draw a glassmorphic floating tooltip near the active/hovered band
 */
function drawTooltip(c: CanvasRenderingContext2D, width: number, height: number) {
	const targetIndex = draggingIndex !== null ? draggingIndex : (hoveredIndex !== null ? hoveredIndex : selectedIndex);
	if (targetIndex === null || !localBands[targetIndex]) return;

	const band = localBands[targetIndex];
	const bx = freqToX(band.freq, width);
	const by = gainToY(band.gain, height);

	const tooltipW = 180;
	const tooltipH = 50;
	const radius = 8;

	// Center horizontally, clamp to canvas bounds
	let tx = bx - tooltipW / 2;
	tx = Math.max(CONFIG.padding, Math.min(width - CONFIG.padding - tooltipW, tx));

	// Position above handle, or below if too close to top
	let ty = by - tooltipH - 15;
	if (ty < CONFIG.padding) {
		ty = by + 20; // Draw below handle
	}

	c.save();
	c.shadowColor = "rgba(0, 0, 0, 0.4)";
	c.shadowBlur = 12;
	c.shadowOffsetX = 0;
	c.shadowOffsetY = 6;

	// Glassmorphic background and border
	drawRoundedRect(
		c,
		tx,
		ty,
		tooltipW,
		tooltipH,
		radius,
		"rgba(15, 23, 42, 0.92)", // Slate-900 glass look
		"rgba(167, 139, 250, 0.35)", // Violet border
		1.5,
	);
	c.restore();

	// Draw Text
	c.fillStyle = "#ffffff";
	c.font = "bold 11px 'Outfit', sans-serif";
	c.textAlign = "left";
	const typeMap: Record<string, string> = {
		PK: "Peak",
		LSQ: "Low Shelf",
		HSQ: "High Shelf",
		NOTCH: "Notch",
	};
	const typeStr = typeMap[band.type] || band.type;
	c.fillText(`Band ${band.index + 1} (${typeStr})`, tx + 10, ty + 18);

	// Subtitle values
	c.fillStyle = "rgba(255, 255, 255, 0.7)";
	c.font = "10px 'Outfit', sans-serif";
	c.fillText(
		`Freq: ${band.freq} Hz  |  Gain: ${band.gain} dB  |  Q: ${band.q}`,
		tx + 10,
		ty + 36,
	);
}

/**
 * Redraw the entire canvas
 */
export function draw() {
	if (!canvas || !ctx) return;
	const width = (canvas as any).logicalWidth || canvas.width;
	const height = (canvas as any).logicalHeight || canvas.height;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	drawGrid(ctx, width, height);
	drawCurve(ctx, width, height);
	drawHandles(ctx, width, height);
	drawTooltip(ctx, width, height);
}

/**
 * INITIALIZATION API: Binds DOM events to the canvas
 */
export function renderPEQ(
	_container: HTMLElement, // Left for compatibility
	bands: Band[],
	updateCallback: (index: number, key: string, value: any) => void,
) {
	localBands = bands;
	onUpdateCallback = updateCallback;

	canvas = document.getElementById("eqCanvas") as HTMLCanvasElement;
	if (!canvas) return;
	ctx = canvas.getContext("2d");

	if (!(canvas as any).listenersBound) {
		(canvas as any).listenersBound = true;

		// Resize observer for canvas scalability
		const resizeObserver = new ResizeObserver(() => resizeCanvas());
		if (canvas.parentElement) {
			resizeObserver.observe(canvas.parentElement);
		}

		resizeCanvas();

		// MOUSE DRAGGING ON CANVAS
		canvas.addEventListener("mousedown", (e) => {
			const rect = canvas!.getBoundingClientRect();
			const scaleX = (canvas as any).logicalWidth / rect.width;
			const scaleY = (canvas as any).logicalHeight / rect.height;
			const x = (e.clientX - rect.left) * scaleX;
			const y = (e.clientY - rect.top) * scaleY;

			let closestIdx = -1;
			let minDst = 1000;

			const w = (canvas as any).logicalWidth;
			const h = (canvas as any).logicalHeight;

			localBands.forEach((band) => {
				const bx = freqToX(band.freq, w);
				const by = gainToY(band.gain, h);
				const dist = Math.sqrt((x - bx) ** 2 + (y - by) ** 2);
				
				// Click threshold of 24 pixels
				if (dist < 24) {
					if (dist < minDst) {
						minDst = dist;
						closestIdx = band.index;
					}
				}
			});

			if (closestIdx !== -1) {
				draggingIndex = closestIdx;
				selectedIndex = closestIdx;
				draw();
			}
		});

		// Canvas Hover Detection
		canvas.addEventListener("mousemove", (e) => {
			if (draggingIndex !== null) return;
			const rect = canvas!.getBoundingClientRect();
			const w = (canvas as any).logicalWidth || rect.width;
			const h = (canvas as any).logicalHeight || rect.height;
			const scaleX = w / rect.width;
			const scaleY = h / rect.height;
			const mx = (e.clientX - rect.left) * scaleX;
			const my = (e.clientY - rect.top) * scaleY;

			let closestIdx = -1;
			let minDst = 1000;

			localBands.forEach((band) => {
				const bx = freqToX(band.freq, w);
				const by = gainToY(band.gain, h);
				const dist = Math.sqrt((mx - bx) ** 2 + (my - by) ** 2);
				if (dist < 24) {
					if (dist < minDst) {
						minDst = dist;
						closestIdx = band.index;
					}
				}
			});

			if (closestIdx !== hoveredIndex) {
				hoveredIndex = closestIdx === -1 ? null : closestIdx;
				draw();
			}
		});

		canvas.addEventListener("mouseleave", () => {
			if (hoveredIndex !== null) {
				hoveredIndex = null;
				draw();
			}
		});

		window.addEventListener("mousemove", (e) => {
			if (draggingIndex === null || !canvas) return;

			const rect = canvas.getBoundingClientRect();
			const w = (canvas as any).logicalWidth || rect.width;
			const h = (canvas as any).logicalHeight || rect.height;

			const scaleX = w / rect.width;
			const scaleY = h / rect.height;

			const relX = (e.clientX - rect.left) * scaleX;
			const relY = (e.clientY - rect.top) * scaleY;

			const clampedX = Math.max(
				CONFIG.padding,
				Math.min(w - CONFIG.padding, relX),
			);
			const clampedY = Math.max(
				CONFIG.padding,
				Math.min(h - CONFIG.padding, relY),
			);

			const freq = Math.round(xToFreq(clampedX, w));
			const gain = Math.round(yToGain(clampedY, h) * 10) / 10;

			// Limit gain range within -12 to 12
			const clampedGain = Math.max(-12, Math.min(12, gain));

			const clampedFreq = Math.max(CONFIG.minFreq, Math.min(CONFIG.maxFreq, freq));

			handleUpdate(draggingIndex, "freq", clampedFreq);
			handleUpdate(draggingIndex, "gain", clampedGain);
		});

		window.addEventListener("mouseup", () => {
			if (draggingIndex !== null) {
				draggingIndex = null;
				if (typeof (window as any).pushHistory === "function") {
					(window as any).pushHistory();
				}
			}
		});
	}

	draw();
}

/**
 * Handle state update callbacks
 */
function handleUpdate(index: number, key: string, value: any) {
	if (onUpdateCallback) {
		onUpdateCallback(index, key, value);
	}

	const band = localBands[index];
	if (band) {
		if (key === "freq") band.freq = Number(value);
		if (key === "gain") band.gain = Number(value);
		if (key === "q") band.q = Number(value);
		if (key === "type") band.type = String(value);
		if (key === "enabled") band.enabled = Boolean(value);

		draw();
	}
}
