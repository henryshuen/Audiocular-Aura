# Shelf filters and reconstruction limits
Production FreeDSP supports PK, LSQ and HSQ with the verified coefficient model. Readback uses path0 coefficients and saved-profile metadata; source, freshness, active rate and path1 remain unconfirmed.
Unity coefficients cannot uniquely recover original filter parameters or enabled state. Frequency/Q/gain inversion is an approximation; Q metadata is raw/256 and gain whole dB. Native/wire formats are unchanged. Offline stability and signed24 checks remain necessary, especially near low-frequency high-rate boundaries.
