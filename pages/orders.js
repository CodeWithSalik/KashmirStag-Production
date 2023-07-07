import React from 'react'
import Order from '@/models/Order'
import mongoose from 'mongoose'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const Orders = () => {
  const router = useRouter()
  
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      router.push('/')

    }
  }, [router.query]);
  return (
    <div>
              <h1 className='font-semibold text-center text-2xl p-8'>My Orders</h1>
    <div className="container mx-auto">
      <div className="flex flex-col">
        <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    <th className="py-2 px-4 bg-gray-200 border-b">Song</th>
                    <th className="py-2 px-4 bg-gray-200 border-b">Artist</th>
                    <th className="py-2 px-4 bg-gray-200 border-b">Year</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-2 px-4 border-b">The Sliding Mr. Bones (Next Stop, Pottersville)</td>
                    <td className="py-2 px-4 border-b">Malcolm Lockyer</td>
                    <td className="py-2 px-4 border-b">1961</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b">Witchy Woman</td>
                    <td className="py-2 px-4 border-b">The Eagles</td>
                    <td className="py-2 px-4 border-b">1972</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4 border-b">Shining Star</td>
                    <td className="py-2 px-4 border-b">Earth, Wind, and Fire</td>
                    <td className="py-2 px-4 border-b">1975</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export async function getServerSideProps(context) {
  const user = context.user
  if (!mongoose.connections[0].readyState) {
    await mongoose.connect(process.env.MONGO_URI)
  }
  let orders = await Order.find({ user: user })


  return {
    props: { order: orders },
  }
}



export default Orders
