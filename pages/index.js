import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import CircularProgress from '@mui/material/CircularProgress';

export default function Home() {
  const [audioUrl, setAudioUrl] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginCount, setLoginCount] = useState(0); // Assume the login count is initially 0
  const [username, setUsername] = useState('');
  const [messages, setMessages] = useState([]);

  const messageListRef = useRef(null);
  const textAreaRef = useRef(null);
  const audioRef = useRef(null); // Reference to the audio element


  useEffect(() => {
    const messageList = messageListRef.current;
    messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  useEffect(() => {
    textAreaRef.current.focus();
  }, []);

  const handleError = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: 'assistant',
        content:
          "Oops, it looks like my response got cut short. Please try sending your message again and I'll do my best to respond in full. Thank you for your patience!"
      }
    ]);
    setLoading(false);
    setUserInput('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userInput.trim() === '') {
      return;
    }

    setLoading(true);
    const context = [...messages, { role: 'user', content: userInput }];
    setMessages(context);

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ messages: context })
    });

    if (!response.ok) {
      handleError();
      return;
    }

    setUserInput('');

    const data = await response.json();

    setMessages((prevMessages) => [
      ...prevMessages,
      { role: 'assistant', content: data.result.content }
    ]);
    setAudioUrl(data.audioUrl);
    setLoading(false);
  };

  const handleVoiceToggle = () => {
    if (!voiceOn && audioRef.current) {
      // Pause and mute the audio if the voice toggle is turned off and audio is currently playing
      audioRef.current.pause();
      audioRef.current.muted = true;
    } else if (voiceOn && audioRef.current) {
      // Unmute the audio if the voice toggle is turned on and audio is currently paused
      audioRef.current.muted = false;
      audioRef.current.play();
    }
    setVoiceOn((prevState) => !prevState);
  };

  const handleEnter = (e) => {
    if (e.key === 'Enter' && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (voiceOn && audioUrl) {
      const audioElement = new Audio(audioUrl);
      audioRef.current = audioElement; // Store the reference to the audio element
      audioElement.play();
    }
  }, [voiceOn, audioUrl]);

  useEffect(() => {
    let assistantGreeting;
    if (loginCount > 1) {
      assistantGreeting = `Hi there ${username}! Welcome back!`;
    } else {
      assistantGreeting = `Hi there ${username}! I see you are new here. I am Valerie, your assistant. Would you like a tour?`;
    }
    setMessages([
      {
        role: 'assistant',
        content: assistantGreeting
      }
    ]);
  }, [loginCount, username]);

  return (
    <>
      <Head>
        <title>Valerie</title>
        <meta name="description" content="GPT-4 interface" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <a>Valerie</a>
        </div>
        <div className={styles.navlinks}></div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {messages.map((message, index) => (
              <div
                key={index}
                className={
                  message.role === 'user' && loading && index === messages.length - 1
                    ? styles.usermessagewaiting
                    : message.role === 'assistant'
                    ? styles.apimessage
                    : styles.usermessage
                }
              >
                {message.role === 'assistant' ? (
                  <Image
                    src="/openai.png"
                    alt="AI"
                    width="30"
                    height="30"
                    className={styles.boticon}
                    priority={true}
                  />
                ) : (
                  <Image
                    src="/usericon.png"
                    alt="Me"
                    width="30"
                    height="30"
                    className={styles.usericon}
                    priority={true}
                  />
                )}
                <div className={styles.markdownanswer}>
                  <ReactMarkdown linkTarget="_blank">{message.content}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}
                type="text"
                id="userInput"
                name="userInput"
                placeholder={loading ? 'Waiting for response...' : 'Talk to Valerie...'}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button type="submit" disabled={loading} className={styles.generatebutton}>
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20} />
                  </div>
                ) : (
                  <svg viewBox="0 0 20 20" className={styles.svgicon} xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
          <div className={styles.voiceToggle}>
            <label className={styles.toggleLabel}>
              <a11> oic Voice On/Off</a11><br/><br/><br/>
              <input
                type="checkbox"
                checked={voiceOn}
                onChange={handleVoiceToggle}
                className={styles.toggleInput}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.footer}><br/><br/>
            <p>Powered by <a>OpenAI</a></p>
          </div>
        </div>
      </main>
    </>
  );
}
