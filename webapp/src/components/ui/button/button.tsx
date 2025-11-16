import { cn } from '@/lib/utils'
import { Ripple, Spinner, useButton } from '@heroui/react'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

const buttonVariants = cva(
  'relative inline-flex items-center justify-center whitespace-nowrap font-semibold rounded-md text-sm ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95 overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'bg-rgba128-100 border border-rgba255-300 hover:bg-rgba128-450 active:bg-gradient-to-tr active:from-rgba128-100 active:to-rgba128-450 disabled:bg-rgba128-190',
        primary:
          '!bg-red-200 border border-rgba255-300 hover:bg-red-300 focus:bg-red-300 active:bg-gradient-to-tr active:from-red-200 active:to-red-300 disabled:bg-rgba235-79-39-390',
        secondary:
          'bg-rgba33-720 border border-rgba255-300 hover:bg-rgba128-450 active:bg-gradient-to-tr active:from-rgba33-720 active:to-rgba128-450 disabled:bg-rgba128-190',
        green:
          'bg-green-100 border border-bg-green-100 hover:bg-green-200 active:bg-gradient-to-tr active:from-green-100 active:to-green-200 disabled:bg-gray-400',
        blue: 'bg-blue-200 border border-rgba255-300 hover:bg-blue-300 active:bg-gradient-to-tr active:from-blue-200 active:to-blue-300 disabled:bg-gray-400',
        black:
          'bg-rgba10-150 border border-rgba255-100 hover:bg-rgba128-450 active:bg-gradient-to-tr active:from-rgba10-150 active:to-rgba128-450 disabled:bg-rgba128-190 backdrop-blur-[2.5rem]',
        red: '!bg-red-100 border border-rgba255-300 hover:bg-red-300 focus:bg-red-300 active:bg-gradient-to-tr active:from-red-200 active:to-red-300 disabled:bg-rgba235-79-39-390',
        cyan: '!bg-cyan-50d border border-rgba255-300 hover:bg-cyan-50d focus:bg-cyan-50d active:bg-gradient-to-tr active:from-cyan-50d active:to-cyan-50d disabled:bg-rgba80-210-193-170',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base',
        icon: 'h-10 w-10',
        // Custom sizes
        xs: 'h-8 px-2 text-xs',
        '2xl': 'h-14 rounded-xl px-12 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  isLoading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const {
      domRef,
      spinnerSize,
      spinner = <Spinner color="current" size={spinnerSize} />,
      spinnerPlacement,
      getButtonProps,
      getRippleProps,
    } = useButton({
      ref,
      isLoading,
      ...(props as any),
    })

    const { ripples, onClear } = getRippleProps()

    const buttonProps = getButtonProps()
    const { className: baseClassName, ...restButtonProps } = buttonProps

    return (
      <button
        {...restButtonProps}
        ref={domRef}
        disabled={disabled || isLoading}
        className={cn(buttonVariants({ variant, size }), baseClassName, className)}
      >
        {!isLoading && leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
        {isLoading && spinnerPlacement === 'start' && spinner}
        {isLoading ? loadingText || <>{children}</> : <>{children}</>}
        {isLoading && spinnerPlacement === 'end' && spinner}
        {!isLoading && rightIcon && <span className="inline-flex items-center">{rightIcon}</span>}
        <Ripple ripples={ripples} onClear={onClear} />
      </button>
    )
  },
)

Button.displayName = 'Button'

export { Button, buttonVariants }
