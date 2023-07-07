import React, { useEffect } from 'react'
import { useRouter } from 'next/router';

const MyAccount = () => {
    const router = useRouter()
    useEffect(() => {
        if (!localStorage.getItem('token')) {
          router.push('/')
    
        }
      }, [router.query]);

        
        return (
            <div>

            </div>
        )
    }

export default MyAccount
