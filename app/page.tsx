import dynamic from 'next/dynamic'
const ChatPrototypeWJ = dynamic(() => import('../components/ChatPrototypeWJ'), { ssr: false })
export default function Page(){ return <ChatPrototypeWJ /> }
