import React from "react"

const SidebarProvider = ({ children, ...props }) => {
  return <div {...props}>{children}</div>
}

const Sidebar = ({ children, className = "", ...props }) => {
  return (
    <aside className={`flex flex-col h-full ${className}`} {...props}>
      {children}
    </aside>
  )
}

const SidebarHeader = ({ children, className = "", ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

const SidebarContent = ({ children, className = "", ...props }) => {
  return <div className={`flex-1 overflow-y-auto ${className}`} {...props}>{children}</div>
}

const SidebarFooter = ({ children, className = "", ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

const SidebarGroup = ({ children, className = "", ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

const SidebarGroupLabel = ({ children, className = "", ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

const SidebarGroupContent = ({ children, className = "", ...props }) => {
  return <div className={className} {...props}>{children}</div>
}

const SidebarMenu = ({ children, className = "", ...props }) => {
  return <ul className={className} {...props}>{children}</ul>
}

const SidebarMenuItem = ({ children, className = "", ...props }) => {
  return <li className={className} {...props}>{children}</li>
}

const SidebarMenuButton = React.forwardRef(({ children, className = "", asChild, ...props }, ref) => {
  const Comp = asChild ? React.Fragment : "button"
  if (asChild) {
    return <>{children}</>
  }
  return (
    <button ref={ref} className={className} {...props}>
      {children}
    </button>
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

const SidebarTrigger = ({ className = "", ...props }) => {
  return (
    <button className={className} {...props}>
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
      </svg>
    </button>
  )
}

export {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
}