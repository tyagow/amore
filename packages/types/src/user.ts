export interface User {
  id: string
  email: string
  name: string | null
  image: string | null
  plan: 'free' | 'premium'
  createdAt: Date
}
