import { useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Hidden by default, shows when opened */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      
      {/* Main layout - no offset when sidebar is closed */}
      <div className={sidebarOpen ? 'pl-72' : ''}>
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main content */}
        <main className="py-4">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  )
}

export default Layout
