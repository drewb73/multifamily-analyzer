'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export function useIsAdmin() {
  const { user } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      setIsLoading(false)
      return
    }

    const checkAdmin = async () => {
      try {
        const response = await fetch('/api/user/is-admin')
        const data = await response.json()
        setIsAdmin(data.isAdmin || false)
      } catch (error) {
        console.error('Failed to check admin status:', error)
        setIsAdmin(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdmin()
  }, [user])

  return { isAdmin, isLoading }
}