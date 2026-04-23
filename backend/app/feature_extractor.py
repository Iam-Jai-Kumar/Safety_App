import librosa
import numpy as np

def extract_hybrid_features(file_path, max_pad_len=128):
    y, sr = librosa.load(file_path, duration=3)

    min_samples = int(sr * 0.5)
    if len(y) < min_samples:
        y = np.pad(y, (0, min_samples - len(y)))

    y = librosa.util.normalize(y)

    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
    mfcc_delta = librosa.feature.delta(mfcc)
    mfcc_delta2 = librosa.feature.delta(mfcc, order=2)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr)
    rms = librosa.feature.rms(y=y)
    centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
    bandwidth = librosa.feature.spectral_bandwidth(y=y, sr=sr)
    rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr)
    zcr = librosa.feature.zero_crossing_rate(y)

    combined = np.vstack([
        mfcc, mfcc_delta, mfcc_delta2,
        chroma, rms, centroid,
        bandwidth, rolloff, zcr
    ])

    if combined.shape[1] < max_pad_len:
        combined = np.pad(combined, ((0,0),(0, max_pad_len - combined.shape[1])))
    else:
        combined = combined[:, :max_pad_len]

    return combined.T
