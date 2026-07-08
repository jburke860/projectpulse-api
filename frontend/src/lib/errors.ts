export function getMutationErrorMessage(error: unknown) {
  if (!error) return null

  const response = (error as {
    response?: { data?: { errors?: string[]; message?: string } }
  }).response

  if (response?.data?.errors?.length) {
    return response.data.errors.join(' ')
  }

  if (response?.data?.message) {
    return response.data.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
