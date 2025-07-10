export default function Loading() {
  return (
    <div className="flex justify-center items-center h-32 w-full">
      <div className="relative w-24 h-24">
        <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-purple-500 border-r-transparent border-b-purple-300 border-l-transparent animate-spin"></div>
        <div className="absolute top-2 left-2 w-20 h-20 rounded-full border-4 border-t-transparent border-r-blue-400 border-b-transparent border-l-blue-600 animate-spin"></div>
      </div>
    </div>
  )
}
