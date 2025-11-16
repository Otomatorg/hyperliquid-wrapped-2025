import dynamic from 'next/dynamic'
import Loading from './loading'

const Home = dynamic(() => import('@/components/features/home/home'), {
  loading: () => <Loading />,
})

export default Home
