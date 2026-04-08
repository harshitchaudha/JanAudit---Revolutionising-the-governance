import { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import './VoiceAssistant.css';

export default function VoiceAssistant() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [statusText, setStatusText] = useState('Voice Assistant');
    const synthRef = useRef(window.speechSynthesis);

    useEffect(() => {
        // Stop speech synthesis when component unmounts
        return () => synthRef.current.cancel();
    }, []);

    const speak = (text) => {
        if (!synthRef.current) return;
        synthRef.current.cancel(); // Stop any ongoing speech

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => {
            setIsPlaying(false);
            setStatusText('Finished reading');
            setTimeout(() => setStatusText('Voice Assistant'), 2000);
        };
        utterance.onerror = (e) => {
            console.error('Speech synthesis error', e);
            setIsPlaying(false);
            setStatusText('Error playing audio');
        };

        synthRef.current.speak(utterance);
    };

    const handlePlayReading = async () => {
        if (isPlaying) {
            synthRef.current.cancel();
            setIsPlaying(false);
            setStatusText('Playback stopped');
            return;
        }

        setIsPlaying(true);
        setStatusText('Fetching data...');

        try {
            const stats = await api.getStats();
            const anomalies = await api.getAnomalies();
            
            setStatusText('Reading overview...');
            
            let report = "Welcome to the Jan Audit overview. ";
            report += `Currently, there are ${stats.documentsProcessed} documents processed, `;
            report += `with a total recorded expenditure of ${formatCurrency(stats.totalExpenditure)}. `;
            report += `We have detected ${stats.anomaliesDetected} potential anomalies across the records. `;
            
            if (anomalies && anomalies.length > 0) {
                report += `Here are the details of the most recent anomalies. `;
                // Read up to 3 anomalies
                const topAnomalies = anomalies.slice(0, 3);
                topAnomalies.forEach((anom, index) => {
                    report += `Anomaly ${index + 1}: ${anom.anomalyType}. `;
                    // Strip weird characters and make it readable
                    const safeDesc = anom.description.replace(/₹/g, 'rupees ').replace(/%/g, ' percent');
                    report += `${safeDesc}. `;
                });
            } else {
                report += 'No recent anomalies to report.';
            }

            speak(report);

        } catch (error) {
            console.error("Failed to load data for voice assistant:", error);
            setStatusText('Failed to fetch data');
            speak("I'm sorry, I was unable to fetch the latest readings. Please ensure you are connected to the network.");
        }
    };

    const formatCurrency = (amount) => {
        return (amount / 10000000).toFixed(2) + " Crores";
    };

    return (
        <div className="voice-assistant-container">
            {isOpen && (
                <div className="voice-panel glow-effect">
                    <p className="voice-status">{statusText}</p>
                    <button className="voice-action-btn" onClick={handlePlayReading}>
                        {isPlaying ? '⏹️ Stop Reading' : '▶️ Play Summary'}
                    </button>
                    <p className="voice-hint">Reads out dashboard statistics and recent anomaly descriptions aloud.</p>
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
