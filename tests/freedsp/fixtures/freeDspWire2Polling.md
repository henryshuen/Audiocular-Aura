# FreeDSP readback evidence
Fixed queries 477 (nine metadata bands) and 446 (path0 coefficient wires) are strictly correlated. Metadata contains sample-rate raw value, wire, frequency Hz, Q raw/256, type and integer gain dB. Coefficients contain path, wire, exponent and five signed24 values. Logical count is separate from buffer capacity.
Matching replies do not prove same-tuple freshness, RAM/Flash origin, enabled state or complete stereo readback. Pending reply=0 permits bounded GET polling without resending SET. Wrong command/module/path/wire must never be accepted.
Golden capture data is de-identified. Raw packet bytes and numerical fields are preserved for deterministic offline tests. No diagnostic is automatically executed by production CONNECT or launch.
