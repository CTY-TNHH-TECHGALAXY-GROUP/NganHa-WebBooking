import math
import wave

import numpy as np


SR = 44100
DURATION = 11.2
N = int(SR * DURATION)
t = np.arange(N, dtype=np.float64) / SR
rng = np.random.default_rng(1487)


def adsr(length, attack=0.05, release=0.7):
    env = np.ones(length, dtype=np.float64)
    a = max(1, int(attack * SR))
    r = max(1, int(release * SR))
    env[:a] = np.linspace(0.0, 1.0, a)
    env[-r:] *= np.linspace(1.0, 0.0, r)
    return env


audio = np.zeros(N, dtype=np.float64)

# Soft running water / room ambience: layered, smoothed noise.
noise = rng.normal(0.0, 1.0, N)
kernel = np.hanning(601)
kernel /= kernel.sum()
water = np.convolve(noise, kernel, mode="same")
water += 0.35 * np.convolve(rng.normal(0.0, 1.0, N), np.hanning(81) / np.hanning(81).sum(), mode="same")
audio += 0.09 * water

# Gentle piano-like tones with slow decay.
notes = [
    (0.15, 220.00, 1.8, 0.10),
    (1.90, 261.63, 2.1, 0.08),
    (3.85, 329.63, 1.9, 0.07),
    (5.85, 293.66, 2.2, 0.075),
    (8.00, 246.94, 2.5, 0.08),
]
for start, freq, dur, amp in notes:
    i0 = int(start * SR)
    length = min(int(dur * SR), N - i0)
    tt = np.arange(length, dtype=np.float64) / SR
    tone = np.sin(2 * math.pi * freq * tt)
    tone += 0.45 * np.sin(2 * math.pi * freq * 2.0 * tt)
    tone += 0.18 * np.sin(2 * math.pi * freq * 3.0 * tt)
    audio[i0 : i0 + length] += amp * tone * adsr(length, 0.035, dur * 0.65)

# Coconut oil drop at the opening.
drop_start = int(0.42 * SR)
drop_len = int(0.33 * SR)
tt = np.arange(drop_len, dtype=np.float64) / SR
drop_env = np.exp(-tt * 18.0)
drop = 0.35 * np.sin(2 * math.pi * 520 * tt) * drop_env
drop += 0.16 * rng.normal(0.0, 1.0, drop_len) * np.exp(-tt * 35.0)
audio[drop_start : drop_start + drop_len] += drop

# Very low breath-like pad.
audio += 0.025 * np.sin(2 * math.pi * 55 * t) * (0.7 + 0.3 * np.sin(2 * math.pi * 0.08 * t))

fade = int(0.55 * SR)
audio[:fade] *= np.linspace(0.0, 1.0, fade)
audio[-fade:] *= np.linspace(1.0, 0.0, fade)
audio = np.tanh(audio * 1.8) * 0.58

stereo = np.column_stack([audio * 0.96, audio])
pcm = np.int16(np.clip(stereo, -1.0, 1.0) * 32767)

with wave.open("output/spa_commercial_audio.wav", "wb") as f:
    f.setnchannels(2)
    f.setsampwidth(2)
    f.setframerate(SR)
    f.writeframes(pcm.tobytes())

print("wrote output/spa_commercial_audio.wav")
