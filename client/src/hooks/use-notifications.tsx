import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useAuth } from './use-auth'
import { toast } from '@/hooks/use-toast'

// Interface para notificação
interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  timestamp: string
  autoClose?: number
  persistent?: boolean
  from?: {
    id: string
    name: string
    role: string
  }
  broadcast?: boolean
  test?: boolean
  read?: boolean
}

// Interface para o contexto
interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  markAsRead: (notificationId: string) => void
  markAllAsRead: () => void
  clearNotification: (notificationId: string) => void
  clearAllNotifications: () => void
  sendTestNotification: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

interface NotificationsProviderProps {
  children: ReactNode
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5

  // Calcular contagem de não lidas
  const unreadCount = notifications.filter(n => !n.read).length

  // Conectar ao WebSocket
  const connect = () => {
    if (!user || user.tipo_usuario !== 'super_admin') {
      console.log('[Notifications] Usuário não é SuperAdmin, WebSocket não será conectado')
      return
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('[Notifications] WebSocket já conectado')
      return
    }

    setConnectionStatus('connecting')
    console.log('[Notifications] Conectando ao WebSocket...')

    // Determinar URL do WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    const wsUrl = `${protocol}//${host}/ws?token=${user.id}`

    try {
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('[Notifications] WebSocket conectado com sucesso')
        setIsConnected(true)
        setConnectionStatus('connected')
        reconnectAttempts.current = 0
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[Notifications] Mensagem recebida:', data)

          switch (data.type) {
            case 'connection_established':
              console.log('[Notifications] Conexão estabelecida:', data.message)
              break

            case 'notification':
              const notification = data.data as Notification
              console.log('[Notifications] ✅ Nova notificação recebida:', notification)
              console.log('[Notifications] Adicionando à lista de notificações...')
              
              // Verificar se é um evento do WAHA
              if (notification.data && notification.data.event && notification.data.event.startsWith('waha.')) {
                console.log('[Notifications] 🟢 Evento WAHA detectado:', notification.data.event)
                handleWahaEvent(notification.data)
              }
              
              // Adicionar à lista
              setNotifications(prev => {
                const newList = [notification, ...prev]
                console.log('[Notifications] Lista atualizada com', newList.length, 'notificações')
                return newList
              })
              
              // Mostrar toast se não for persistente ou teste
              if (!notification.persistent || notification.test) {
                console.log('[Notifications] Mostrando toast para notificação')
                toast({
                  title: notification.title,
                  description: notification.message,
                  variant: notification.type === 'error' ? 'destructive' : 'default',
                  duration: notification.autoClose || (notification.type === 'error' ? 8000 : 5000),
                })
              } else {
                console.log('[Notifications] Notificação persistente, não mostrando toast')
              }
              break

            case 'pong':
              // Resposta ao ping
              break

            default:
              console.log('[Notifications] Tipo de mensagem desconhecido:', data.type)
          }
        } catch (error) {
          console.error('[Notifications] Erro ao processar mensagem:', error)
        }
      }

      ws.onclose = (event) => {
        console.log(`[Notifications] WebSocket desconectado: ${event.code} - ${event.reason}`)
        setIsConnected(false)
        setConnectionStatus('disconnected')
        wsRef.current = null

        // Verificar se foi erro de autenticação
        if (event.code === 1008) {
          console.log('[Notifications] ❌ Erro de autenticação - redirecionando para login')
          setConnectionStatus('error')
          toast({
            title: 'Sessão Expirada',
            description: 'Sua sessão expirou. Redirecionando para login...',
            variant: 'destructive',
            duration: 3000,
          })
          
          // Redirecionar para login após 2 segundos
          setTimeout(() => {
            window.location.href = '/login'
          }, 2000)
          return
        }

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          scheduleReconnect()
        }
      }

      ws.onerror = (error) => {
        console.error('[Notifications] Erro no WebSocket:', error)
        setConnectionStatus('error')
        
        // Se houver erro, também pode ser questão de autenticação
        console.log('[Notifications] ⚠️ Erro de conexão - verificando autenticação...')
      }

    } catch (error) {
      console.error('[Notifications] Erro ao criar WebSocket:', error)
      setConnectionStatus('error')
    }
  }

  // Agendar reconexão com verificação de sessão
  const scheduleReconnect = async () => {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000) // Backoff exponencial até 30s
    reconnectAttempts.current++
    
    console.log(`[Notifications] Reagendando reconexão em ${delay}ms (tentativa ${reconnectAttempts.current}/${maxReconnectAttempts})`)
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      if (user && user.tipo_usuario === 'super_admin') {
        try {
          // Verificar se a sessão HTTP ainda é válida antes de reconectar
          const response = await fetch('/api/auth/verify')
          
          if (response.status === 401) {
            console.log('[Notifications] ❌ Sessão HTTP inválida - cancelando reconexão e redirecionando')
            toast({
              title: 'Sessão Expirada',
              description: 'Sua sessão expirou durante a reconexão. Redirecionando para login...',
              variant: 'destructive',
              duration: 2000,
            })
            
            setTimeout(() => {
              window.location.href = '/login'
            }, 1000)
            return
          }
          
          if (response.ok) {
            console.log('[Notifications] ✅ Sessão HTTP válida - prosseguindo com reconexão')
            connect()
          }
        } catch (error) {
          console.error('[Notifications] Erro ao verificar sessão na reconexão:', error)
          // Em caso de erro de rede, tentar reconectar mesmo assim
          connect()
        }
      }
    }, delay)
  }

  // Desconectar
  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (wsRef.current) {
      console.log('[Notifications] Desconectando WebSocket...')
      wsRef.current.close(1000, 'Disconnect requested')
      wsRef.current = null
    }

    setIsConnected(false)
    setConnectionStatus('disconnected')
    reconnectAttempts.current = 0
  }

  // Enviar mensagem
  const sendMessage = (message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }

  // Marcar notificação como lida
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
    
    // Informar ao servidor
    sendMessage({
      type: 'notification_read',
      notificationId
    })
  }

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  // Remover notificação
  const clearNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  // Limpar todas as notificações
  const clearAllNotifications = () => {
    setNotifications([])
  }

  // Processar eventos do WAHA
  const handleWahaEvent = (wahaData: any) => {
    console.log('[Notifications] 🔵 Processando evento WAHA:', wahaData)
    
    switch (wahaData.event) {
      case 'waha.message':
        console.log('[Notifications] 📩 Nova mensagem do WAHA:', wahaData.message)
        
        // Disparar evento customizado para a modal do WhatsApp
        const messageEvent = new CustomEvent('waha-message', {
          detail: {
            session: wahaData.session,
            message: wahaData.message
          }
        })
        window.dispatchEvent(messageEvent)
        
        toast({
          title: 'Nova Mensagem WhatsApp',
          description: `Mensagem recebida na sessão ${wahaData.session}`,
          duration: 3000,
        })
        break
        
      case 'waha.message.status':
        console.log('[Notifications] 📊 Status de mensagem do WAHA:', wahaData.status)
        
        // Disparar evento para atualização de status
        const statusEvent = new CustomEvent('waha-message-status', {
          detail: {
            session: wahaData.session,
            status: wahaData.status
          }
        })
        window.dispatchEvent(statusEvent)
        break
        
      case 'waha.session.status':
        console.log('[Notifications] 🔄 Status da sessão do WAHA:', wahaData.sessionData)
        
        toast({
          title: 'Status da Sessão WhatsApp',
          description: `Sessão ${wahaData.session}: ${wahaData.sessionData.status}`,
          variant: wahaData.sessionData.status === 'WORKING' ? 'default' : 'destructive',
          duration: 5000,
        })
        break
        
      case 'waha.state.change':
        console.log('[Notifications] 🔀 Mudança de estado do WAHA:', wahaData.state)
        
        toast({
          title: 'Estado do WhatsApp Alterado',
          description: `Estado da sessão ${wahaData.session} foi alterado`,
          duration: 3000,
        })
        break
        
      default:
        console.log('[Notifications] ❓ Evento WAHA não tratado:', wahaData.event)
    }
  }

  // Enviar notificação de teste
  const sendTestNotification = async () => {
    try {
      console.log('[Notifications] 🧪 Enviando notificação de teste...')
      
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      console.log('[Notifications] Resposta do servidor:', response.status)

      if (response.status === 401) {
        console.log('[Notifications] ❌ HTTP 401 - WebSocket conectado mas sessão HTTP inválida')
        toast({
          title: 'Sessão Expirada',
          description: 'Sua sessão HTTP expirou. Redirecionando para login...',
          variant: 'destructive',
          duration: 2000,
        })
        
        // Redirecionar para login após 1 segundo
        setTimeout(() => {
          window.location.href = '/login'
        }, 1000)
        return
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Notifications] Erro do servidor:', errorText)
        throw new Error('Erro ao enviar notificação de teste')
      }

      const result = await response.json()
      console.log('[Notifications] ✅ Notificação de teste enviada:', result)
      
      toast({
        title: 'Teste Enviado',
        description: 'Notificação de teste foi enviada com sucesso',
      })
    } catch (error) {
      console.error('[Notifications] ❌ Erro ao enviar notificação de teste:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao enviar notificação de teste',
        variant: 'destructive',
      })
    }
  }

  // Efeito para conectar/desconectar baseado no usuário
  useEffect(() => {
    console.log('[Notifications] useEffect executado - user:', user)
    if (user && user.tipo_usuario === 'super_admin') {
      console.log('[Notifications] Usuário SuperAdmin detectado, iniciando conexão WebSocket')
      connect()
    } else {
      console.log('[Notifications] Usuário não é SuperAdmin ou não logado, desconectando', { 
        user: user ? 'existe' : 'null', 
        tipo_usuario: user?.tipo_usuario 
      })
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user])

  // Verificação periódica da sessão HTTP e ping
  useEffect(() => {
    if (!isConnected) return

    const checkSessionAndPing = async () => {
      try {
        // Verificar se a sessão HTTP ainda é válida
        const response = await fetch('/api/auth/verify')
        
        if (response.status === 401) {
          console.log('[Notifications] ❌ Sessão HTTP expirou - desconectando WebSocket')
          toast({
            title: 'Sessão Expirada',
            description: 'Sua sessão expirou. Redirecionando para login...',
            variant: 'destructive',
            duration: 2000,
          })
          
          // Desconectar WebSocket e redirecionar
          disconnect()
          setTimeout(() => {
            window.location.href = '/login'
          }, 1000)
          return
        }
        
        // Se a sessão é válida, enviar ping
        if (response.ok) {
          sendMessage({ type: 'ping' })
        }
      } catch (error) {
        console.error('[Notifications] Erro ao verificar sessão:', error)
      }
    }

    const sessionCheckInterval = setInterval(checkSessionAndPing, 15000) // Verificar a cada 15 segundos

    return () => clearInterval(sessionCheckInterval)
  }, [isConnected])

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [])

  const value: NotificationsContextType = {
    notifications,
    unreadCount,
    isConnected,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAllNotifications,
    sendTestNotification,
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}

// Hook para usar o contexto
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications deve ser usado dentro de um NotificationsProvider')
  }
  return context
}