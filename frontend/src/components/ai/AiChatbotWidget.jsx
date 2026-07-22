import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as aiApi from '../../api/ai'
import { useAuth } from '../../hooks/useAuth'

export default function AiChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([
    { role: 'assistant', content: 'Hello! I am the SAO AI Assistant. How can I help you today?' }
  ])
  const messagesEndRef = useRef(null)
  const { user } = useAuth()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [history, isOpen])

  const mutation = useMutation({
    mutationFn: (data) => aiApi.chat(data),
    onSuccess: (res) => {
      setHistory(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    },
    onError: (err) => {
      setHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err?.response?.data?.message || 'I am currently unavailable.'}` }])
    }
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!message.trim()) return

    const userMessage = message
    setMessage('')
    setHistory(prev => [...prev, { role: 'user', content: userMessage }])
    
    mutation.mutate({ message: userMessage, history })
  }

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-105 z-40"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-[var(--th-surface)] border border-[var(--th-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40">
          
          {/* Header */}
          <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              <h3 className="font-semibold text-sm">SAO AI Assistant</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-blue-100 hover:text-white cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--th-body-bg)]">
            {history.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-[var(--th-surface-alt)] border border-[var(--th-border)] text-[var(--th-text)] rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-[var(--th-surface-alt)] border border-[var(--th-border)] text-[var(--th-text)] rounded-2xl rounded-bl-none px-4 py-2 text-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[var(--th-border-subtle)] bg-[var(--th-surface)] shrink-0">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything..."
                className="w-full rounded-full border border-[var(--th-border)] bg-[var(--th-surface-alt)] pl-4 pr-12 py-2 text-sm text-[var(--th-text)] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                disabled={mutation.isPending}
              />
              <button 
                type="submit" 
                disabled={!message.trim() || mutation.isPending}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-white bg-blue-600 hover:bg-blue-700 rounded-full cursor-pointer disabled:opacity-50 transition-colors"
              >
                <svg className="w-4 h-4 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
            <div className="text-[10px] text-center text-[var(--th-text-faint)] mt-2">
              AI-powered responses may contain errors.
            </div>
          </form>
        </div>
      )}
    </>
  )
}
