import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './styles.css';

const sourceLanguages = ['AUTO', 'ZH', 'AR', 'BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'ES', 'ET', 'FI', 'FR', 'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TR', 'UK'];

const targetLanguages = ['ZH', 'ZH-HANS', 'ZH-HANT', 'AR', 'BG', 'CS', 'DA', 'DE', 'EL', 'EN', 'EN-GB', 'EN-US', 'ES', 'ET', 'FI', 'FR', 'HU', 'ID', 'IT', 'JA', 'KO', 'LT', 'LV', 'NB', 'NL', 'PL', 'PT', 'PT-BR', 'PT-PT', 'RO', 'RU', 'SK', 'SL', 'SV', 'TR', 'UK'];

const App = () => {
    const { t, i18n } = useTranslation();
    const [text, setText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [sourceLang, setSourceLang] = useState('AUTO');
    const [targetLang, setTargetLang] = useState('EN');
    const [inputCharCount, setInputCharCount] = useState(0);
    const [outputCharCount, setOutputCharCount] = useState(0);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [autoTranslate, setAutoTranslate] = useState(true); // 默认勾选

    useEffect(() => {
        if (!process.env.REACT_APP_PASSWORD) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleTranslate = async () => {
        if (!text.trim()) return;
        
        setLoading(true);
        try {
            const body = {
                text: text,
                target_lang: targetLang
            };
            
            if (sourceLang !== 'AUTO') {
                body.source_lang = sourceLang;
            }

            const response = await fetch(`${process.env.REACT_APP_DEEPL_API_URL}/v2/translate`, {
                method: 'POST',
                headers: {
                    'Authorization': `${process.env.REACT_APP_DEEPL_API_Authorization}`,
                    'Content-Type': 'application/json',
                },                
                body: JSON.stringify(body)
            });

            console.console.log(body);
            const data = await response.json();

            if (data.code === 200) {
                setTranslatedText(data.data);
                setOutputCharCount(data.data.length);
                setMessage(t('translationSuccess'));
                setIsError(false);
            } else {
                setMessage(t('translationFailed'));
                setIsError(true);
            }

            setTimeout(() => {
                setMessage('');
            }, 2000);
        } catch (error) {
            console.error('翻译请求错误:', error);
            setMessage(t('translationError'));
            setIsError(true);
            setTimeout(() => {
                setMessage('');
            }, 2000);
        } finally {
            setLoading(false);
        }
    };

    const startTranslateTimer = useCallback((newText) => {
        if (autoTranslate && newText.trim() && !loading) {
            if (window.translateTimer) {
                clearTimeout(window.translateTimer);
            }
            window.translateTimer = setTimeout(() => {
                handleTranslate();
            }, 1000);
        }
    }, [autoTranslate, loading, handleTranslate]);

    const handleTextChange = (e) => {
        const newText = e.target.value;
        setText(newText);
        setInputCharCount(newText.length);

        if (!e.nativeEvent.isComposing && 
            e.nativeEvent.inputType !== 'insertCompositionText') {
            startTranslateTimer(newText);
        }
    };

    const handleComposition = (e) => {
        if (e.type === 'compositionend') {
            const newText = e.target.value;
            startTranslateTimer(newText);
        }
    };

    const handlePaste = (e) => {
        const newText = e.target.value;
        setText(newText);
        setInputCharCount(newText.length);
        startTranslateTimer(newText);
    };

    useEffect(() => {
        return () => {
            if (window.translateTimer) {
                clearTimeout(window.translateTimer);
            }
        };
    }, []);

    useEffect(() => {
        const userLang = navigator.language || navigator.userLanguage;
        if (['zh', 'de', 'en'].includes(userLang.split('-')[0])) {
            i18n.changeLanguage(userLang.split('-')[0]);
        } else {
            i18n.changeLanguage('en');
        }
    }, [i18n]);

    const handleOutputChange = (e) => {
        setTranslatedText(e.target.value);
        setOutputCharCount(e.target.value.length);
    };

    const handleCopy = (textToCopy) => {
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                setMessage(t('copySuccess'));
                setIsError(false);
            })
            .catch(() => {
                setMessage(t('copyFailed'));
                setIsError(true);
            });

        setTimeout(() => {
            setMessage('');
        }, 2000);
    };

    const handleSwapLanguages = () => {
        if (sourceLang !== 'AUTO' && targetLang !== 'AUTO') {
            setSourceLang(targetLang);
            setTargetLang(sourceLang);
        }
    };

    const handlePasswordSubmit = () => {
        if (!process.env.REACT_APP_PASSWORD || password === process.env.REACT_APP_PASSWORD) {
            setIsAuthenticated(true);
        } else {
            setMessage(t('wrongPassword'));
            setIsError(true);
            setTimeout(() => {
                setMessage('');
            }, 2000);
        }
    };

    const changeLanguage = (event) => {
        i18n.changeLanguage(event.target.value);
    };

    if (!isAuthenticated) {
        return (
            <div className="container">
                <h1>LibreTranslator</h1>
                <div className="password-container">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('enterPassword')}
                    />
                    <button onClick={handlePasswordSubmit}>{t('submit')}</button>
                </div>
                {message && (
                    <div className={`message ${isError ? 'error' : 'success'}`}>
                        {message}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="container">
            <h1>LibreTranslator</h1>
            <div className="language-auto-translate">
                <div className="language-switcher">
                    <label>Lang:</label>
                    <select onChange={changeLanguage}>
                        <option value="en">English</option>
                        <option value="zh">中文</option>
                        <option value="de">Deutsch</option>
                    </select>
                </div>
                <div className="auto-translate">
                    <label>
                        <input
                            type="checkbox"
                            checked={autoTranslate}
                            onChange={(e) => setAutoTranslate(e.target.checked)}
                        />
                        {t('autoTranslate')}
                    </label>
                </div>
            </div>
            <div className="language-selection">
                <select value={sourceLang} onChange={(e) => setSourceLang(e.target.value)}>
                    {sourceLanguages.map(langCode => (
                        <option key={langCode} value={langCode}>
                            {langCode === 'AUTO' ? t('Auto') : t(`sourceLanguages.${langCode}`)}
                        </option>
                    ))}
                </select>
                <button onClick={handleSwapLanguages} className="swap-button">⇄</button>
                <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}>
                    {targetLanguages.map(langCode => (
                        <option key={langCode} value={langCode}>
                            {t(`targetLanguages.${langCode}`)}
                        </option>
                    ))}
                </select>
            </div>
            <div className="text-areas">
                <div className="input-text-area">
                    <textarea
                        value={text}
                        onChange={handleTextChange}
                        onCompositionStart={handleComposition}
                        onCompositionEnd={handleComposition}
                        onPaste={handlePaste}
                        placeholder={t('inputPlaceholder')}
                        rows="10"
                    />
                    <div className="info-bar">
                        <div className="char-count">{t('charCount')}: {inputCharCount}</div>
                        <button onClick={() => handleCopy(text)} className="copy-button">{t('copy')}</button>
                    </div>
                </div>
                <div className="output-text-area">
                    <textarea
                        value={translatedText}
                        onChange={handleOutputChange}
                        placeholder={t('outputPlaceholder')}
                        rows="10"
                    />
                    <div className="info-bar">
                        <div className="char-count">{t('charCount')}: {outputCharCount}</div>
                        <button onClick={() => handleCopy(translatedText)} className="copy-button">{t('copy')}</button>
                    </div>
                </div>
            </div>
            <div className="buttons">
                <button onClick={handleTranslate} disabled={loading}>
                    {loading ? t('translating') : t('translate')}
                </button>
            </div>
            {message && (
                <div className={`message ${isError ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}
            <footer className="footer">
                <a href="https://github.com/bestZwei/LibreTranslator" target="_blank" rel="noopener noreferrer">GitHub</a>
                <span> | {t('poweredBy')}</span>
            </footer>
        </div>
    );
};

export default App;
