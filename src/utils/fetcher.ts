export const fetcher = (...args: Parameters<typeof fetch>) : Promise<any> => {
  return fetch(...args).then((res) => res.json())
}
