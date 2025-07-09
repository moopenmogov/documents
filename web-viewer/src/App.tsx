import React, { useState, useEffect, useRef } from 'react'
import { EditorState } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Schema, DOMParser } from 'prosemirror-model'
import { schema } from 'prosemirror-schema-basic'
import { exampleSetup } from 'prosemirror-example-setup'
import io from 'socket.io-client'
import './App.css'

const App: React.FC = () => {
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [newVarName, setNewVarName] = useState('')
  const [newVarValue, setNewVarValue] = useState('')
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' }>()
  
  const editorRef = useRef<HTMLDivElement>(null)
  const editorViewRef = useRef<EditorView | null>(null)
  const socketRef = useRef<any>(null)

  // Initialize ProseMirror editor
  useEffect(() => {
    if (editorRef.current && !editorViewRef.current) {
      const state = EditorState.create({
        schema,
        plugins: exampleSetup({ schema })
      })

      editorViewRef.current = new EditorView(editorRef.current, {
        state,
        dispatchTransaction: (transaction) => {
          const newState = editorViewRef.current!.state.apply(transaction)
          editorViewRef.current!.updateState(newState)
          
          // TODO: Send changes to server
          if (transaction.docChanged) {
            console.log('Document changed')
          }
        }
      })
    }

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy()
      }
    }
  }, [])

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io('http://localhost:3001')
    socketRef.current = socket

    socket.on('connect', () => {
      setIsConnected(true)
      socket.emit('join-document', 'default-doc')
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('variable-updated', (data: { name: string; value: string }) => {
      setVariables(prev => ({ ...prev, [data.name]: data.value }))
      updateDocumentVariables({ ...variables, [data.name]: data.value })
    })

    // Load initial variables
    loadVariables()

    return () => {
      socket.disconnect()
    }
  }, [])

  // Load variables from server
  const loadVariables = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/variables')
      const vars = await response.json()
      setVariables(vars)
      updateDocumentVariables(vars)
    } catch (error) {
      console.error('Error loading variables:', error)
      showStatus('Error loading variables', 'error')
    }
  }

  // Update variables in document
  const updateDocumentVariables = (vars: Record<string, string>) => {
    if (!editorViewRef.current) return

    const view = editorViewRef.current
    const { state } = view
    
    // TODO: Replace variable placeholders with actual values
    // This is a simplified implementation
    console.log('Updating document variables:', vars)
  }

  // Add new variable
  const addVariable = async () => {
    if (!newVarName || !newVarValue) {
      showStatus('Please enter both name and value', 'error')
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/variables/${newVarName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: newVarValue })
      })

      if (response.ok) {
        setVariables(prev => ({ ...prev, [newVarName]: newVarValue }))
        setNewVarName('')
        setNewVarValue('')
        showStatus(`Variable "${newVarName}" added`, 'success')
      } else {
        showStatus('Error adding variable', 'error')
      }
    } catch (error) {
      console.error('Error adding variable:', error)
      showStatus('Error adding variable', 'error')
    }
  }

  // Insert variable placeholder
  const insertVariable = (varName: string) => {
    if (!editorViewRef.current) return

    const view = editorViewRef.current
    const { state, dispatch } = view
    const { from, to } = state.selection
    
    const placeholder = `{{${varName}}}`
    const transaction = state.tr.insertText(placeholder, from, to)
    dispatch(transaction)
  }

  // Show status message
  const showStatus = (message: string, type: 'success' | 'error') => {
    setStatus({ message, type })
    setTimeout(() => setStatus(undefined), 3000)
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h2>Document Sync</h2>
        
        <div className="connection-status">
          <span className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        <div className="section">
          <h3>Variables</h3>
          <div className="variables-list">
            {Object.entries(variables).map(([name, value]) => (
              <div key={name} className="variable-item">
                <div className="variable-info">
                  <strong>{name}</strong>: {value}
                </div>
                <button 
                  onClick={() => insertVariable(name)}
                  className="btn btn-small"
                >
                  Insert
                </button>
              </div>
            ))}
          </div>
          
          <div className="add-variable">
            <input
              type="text"
              placeholder="Variable name"
              value={newVarName}
              onChange={(e) => setNewVarName(e.target.value)}
              className="input"
            />
            <input
              type="text"
              placeholder="Variable value"
              value={newVarValue}
              onChange={(e) => setNewVarValue(e.target.value)}
              className="input"
            />
            <button onClick={addVariable} className="btn">
              Add Variable
            </button>
          </div>
        </div>

        {status && (
          <div className={`status-message ${status.type}`}>
            {status.message}
          </div>
        )}
      </div>

      <div className="editor-container">
        <div className="editor-header">
          <h3>Document Editor</h3>
          <div className="editor-actions">
            <button className="btn">Check Out</button>
            <button className="btn">Sync</button>
          </div>
        </div>
        <div ref={editorRef} className="editor"></div>
      </div>
    </div>
  )
}

export default App 