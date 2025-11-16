import { Dropdown, DropdownTrigger } from '@heroui/react'
import React from 'react'

interface IDropdownCustomProps {
  placement?:
    | 'top'
    | 'bottom'
    | 'right'
    | 'left'
    | 'top-start'
    | 'top-end'
    | 'bottom-start'
    | 'bottom-end'
    | 'left-start'
    | 'left-end'
    | 'right-start'
    | 'right-end'
  trigger: React.ReactNode
  children: React.ReactNode
  dropdownClassName?: string
  dropdownTriggerClassName?: string
}

// Children should be a collection of React.ReactNode
// Example:
// <DropdownCustom>
//   <DropdownItem>Item 1</DropdownItem>
//   <DropdownItem>Item 2</DropdownItem>
//   <DropdownItem>Item 3</DropdownItem>
// </DropdownCustom>

const DropdownCustom = ({
  trigger,
  children,
  placement = 'bottom-end',
  dropdownClassName,
  dropdownTriggerClassName,
}: IDropdownCustomProps) => {
  return (
    <Dropdown placement={placement} className={dropdownClassName}>
      <DropdownTrigger className={dropdownTriggerClassName}>{trigger}</DropdownTrigger>
      <>{children}</>
    </Dropdown>
  )
}

export default DropdownCustom
