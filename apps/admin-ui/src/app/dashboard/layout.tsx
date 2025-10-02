import React from 'react'
import SidebarWrapper from '../../shared/components/sidebar'

const Layout = ({children}: {chidren: React.ReactNode}) => {
  return (
    <div className='flex h-full bg-black min-h-screen'>
      {/* Sidebar */}
      <aside className='w-[280px] min-w-[250px] max-w-[300px] border-r border-r-slate-800 text-white p-4'>
        <div className='sticky top-0'>
            <SidebarWrapper />
        </div>
      </aside>
    </div>
  )
}

export default Layout
