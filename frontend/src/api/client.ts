import axios from 'axios'
import type { ApiResult } from './types'

const baseURL = import.meta.env.VITE_API_URL ?? ''

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
})

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
