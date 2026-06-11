import axios from 'axios'
import type { ApiResult } from './types'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? ''

export const DEMO_SESSION_HEADER = 'X-ProjectPulse-Demo-Session'
export const DEMO_SESSION_STORAGE_KEY = 'projectpulse.demoSessionId'

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const sessionId = getStoredDemoSessionId()

  if (sessionId) {
    config.headers.set(DEMO_SESSION_HEADER, sessionId)
  }

  return config
})

export function getStoredDemoSessionId() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(DEMO_SESSION_STORAGE_KEY)
}

export function setStoredDemoSessionId(sessionId: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(DEMO_SESSION_STORAGE_KEY, sessionId)
}

export function clearStoredDemoSessionId() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(DEMO_SESSION_STORAGE_KEY)
}

export function getApiDocsUrl() {
  const configuredDocsUrl = import.meta.env.VITE_API_DOCS_URL
  if (configuredDocsUrl) return configuredDocsUrl

  if (baseURL) return `${baseURL.replace(/\/$/, '')}/swagger`

  return 'http://localhost:5000/swagger'
}

export async function getData<T>(url: string): Promise<T> {
  const { data } = await api.get<ApiResult<T>>(url)
  return data.data
}

export async function postData<T>(url: string, body: unknown): Promise<T> {
  const { data } = await api.post<ApiResult<T>>(url, body)
  return data.data
}

export async function deleteData<T>(url: string): Promise<T> {
  const { data } = await api.delete<ApiResult<T>>(url)
  return data.data
}

export async function patchData<T>(url: string, body: unknown): Promise<T> {
  const { data } = await api.patch<ApiResult<T>>(url, body)
  return data.data
}

export async function putData<T>(url: string, body: unknown): Promise<T> {
  const { data } = await api.put<ApiResult<T>>(url, body)
  return data.data
}
