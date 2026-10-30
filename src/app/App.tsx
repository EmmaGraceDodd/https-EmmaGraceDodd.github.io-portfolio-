import { RouterProvider } from "react-router"
import { router } from "./routes"
import { Sparkles } from "./interactions"

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Sparkles />
    </>
  )
}
