import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import './VoiceAssistant.css';

const LANGUAGES = {
    en: { label: 'English', code: 'en-IN', flag: '🇬🇧' },
    hi: { label: 'हिन्दी', code: 'hi-IN', flag: '🇮🇳' },
};

function buildReport(stats, anomalies, lang) {
    const fmt = (amount) => (amount / 10000000).toFixed(2) + (lang === 'hi' ? ' करोड़' : ' Crores');

    if (lang === 'hi') {
        let r = 'जन ऑडिट अवलोकन में आपका स्वागत है। ';
        r += `अभी तक ${stats.documentsProcessed} दस्तावेज़ संसाधित किए गए हैं, `;
        r += `कुल दर्ज व्यय ${fmt(stats.totalExpenditure)} है। `;
        r += `हमने ${stats.anomaliesDetected} संभावित विसंगतियाँ पाई हैं। `;

        if (anomalies && anomalies.length > 0) {
            r += 'यहाँ सबसे हाल की विसंगतियों का विवरण है। ';
            anomalies.slice(0, 3).forEach((anom, i) => {
                r += `विसंगति ${i + 1}: ${anom.anomalyType}। `;
                const safe = anom.description.replace(/₹/g, 'रुपये ').replace(/%/g, ' प्रतिशत');
                r += `${safe}। `;
            });
        } else {
            r += 'रिपोर्ट करने के लिए कोई हालिया विसंगति नहीं है।';
        }
        return r;
    }

    // English
    let r = 'Welcome to the Jan Audit overview. ';
    r += `Currently, there are ${stats.documentsProcessed} documents processed, `;
    r += `with a total recorded expenditure of ${fmt(stats.totalExpenditure)}. `;
    r += `We have detected ${stats.anomaliesDetected} potential anomalies across the records. `;

    if (anomalies && anomalies.length > 0) {
        r += 'Here are the details of the most recent anomalies. ';
        anomalies.slice(0, 3).forEach((anom, i) => {
            r += `Anomaly ${i + 1}: ${anom.anomalyType}. `;
            const safe = anom.description.replace(/₹/g, 'rupees ').replace(/%/g, ' percent');
            r += `${safe}. `;
        });
    } else {
        r += 'No recent anomalies to report.';
    }
    return r;
}

export default function VoiceAssistant() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [lang, setLang] = useState('en');
    const [statusText, setStatusText] = useState('Voice Assistant');
    const synthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        return () => synthRef.current.cancel();
    }, []);

    const speak = (text, langCode) => {
        if (!synthRef.current) return;
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langCode;
        utterance.rate = 0.95;
        utterance.onend = () => {
            setIsPlaying(false);
            setStatusText(lang === 'hi' ? 'पढ़ना समाप्त' : 'Finished reading');
            setTimeout(() => setStatusText('Voice Assistant'), 2500);
        };
        utterance.onerror = () => {
            setIsPlaying(false);
            setStatusText(lang === 'hi' ? 'त्रुटि' : 'Error playing audio');
        };
        synthRef.current.speak(utterance);
    };

    const handlePlayReading = async () => {
        if (isPlaying) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setStatusText(lang === 'hi' ? 'प्लेबैक रुका' : 'Playback stopped');
            return;
        }

        setIsPlaying(true);
        setStatusText(lang === 'hi' ? 'डेटा प्राप्त हो रहा है…' : 'Fetching data…');

        try {
            const stats = await api.getStats();
            const anomalies = await api.getAnomalies();
            setStatusText(lang === 'hi' ? 'अवलोकन पढ़ रहा है…' : 'Reading overview…');

            const report = buildReport(stats, anomalies, lang);
            speak(report, LANGUAGES[lang].code);
        } catch {
            const errMsg = lang === 'hi'
                ? 'क्षमा करें, डेटा प्राप्त करने में असमर्थ।'
                : "Sorry, I was unable to fetch the latest readings.";
            setStatusText(lang === 'hi' ? 'डेटा लोड विफल' : 'Failed to fetch data');
            speak(errMsg, LANGUAGES[lang].code);
        }
    };

    return (
        <div className="voice-assistant-container">
            {isOpen && (
                <div className="voice-panel glow-effect">
                    <p className="voice-status">{statusText}</p>

                    {/* Language toggle */}
                    <div className="voice-lang-toggle">
                        {Object.entries(LANGUAGES).map(([key, val]) => (
                            <button
                                key={key}
                                className={`lang-btn ${lang === key ? 'active' : ''}`}
                                onClick={() => { setLang(key); synthRef.current.cancel(); setIsPlaying(false); }}
                            >
                                {val.flag} {val.label}
                            </button>
                        ))}
                    </div>

                    <button className="voice-action-btn" onClick={handlePlayReading}>
                        {isPlaying
                            ? (lang === 'hi' ? '⏹️ रोकें' : '⏹️ Stop Reading')
                            : (lang === 'hi' ? '▶️ सारांश सुनें' : '▶️ Play Summary')}
                    </button>
                    <p className="voice-hint">
                        {lang === 'hi'
                            ? 'डैशबोर्ड आँकड़े और हालिया विसंगतियाँ ज़ोर से पढ़ता है।'
                            : 'Reads out dashboard statistics and recent anomaly descriptions aloud.'}
                    </p>
                </div>
            )}
            <button
                className={`fab-button ${isPlaying ? 'pulse-anim' : ''} ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Voice Assistant"
            >
                {isPlaying ? '🔊' : '🎙️'}
            </button>
        </div>
    );
}
