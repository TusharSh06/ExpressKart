const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div className={`spinner ${sizeClasses[size]}`}></div>
    </div>
  )
}

export default LoadingSpinner
