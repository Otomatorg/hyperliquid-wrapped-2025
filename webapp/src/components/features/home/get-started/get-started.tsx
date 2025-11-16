import { Button } from '@/components/ui/button'
import SendIcon from '@/public/icons/ic-send.svg'
import OtomatoLogo from '@/public/images/img-otomato-logo-v3@2x.png'
import Image from 'next/image'
import { ChangeEvent, memo, useEffect, useRef, useState } from 'react'

const inValidAddress = '0x0000000000000000000000000000000000000000'
const addressRegex = new RegExp(/^0x[a-fA-F0-9]{40}$/)
const TIMEOUT_500 = 500

interface GetStartedProps {
  onSubmit: () => void
}

const GetStarted = ({ onSubmit }: GetStartedProps) => {
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [form, setForm] = useState({
    value: '',
    address: '',
    isValid: false,
    errorMessage: '',
    isLoading: false,
  })

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const convertHlNameToAddress = async (hlName: `${string}.hl`) => {
    const data = await fetch(`https://api.hlnames.xyz/resolve/address/${hlName}`, {
      headers: {
        'X-API-Key': 'CPEPKMI-HUSUX6I-SE2DHEA-YYWFG5Y',
      },
    })

    return await data.json()
  }

  const resolveHlName = async (value: string) => {
    setForm((prev) => ({ ...prev, isLoading: true, errorMessage: '', address: '' }))

    try {
      const [{ address }] = await Promise.all([
        convertHlNameToAddress(value as `${string}.hl`),
        new Promise((resolve) => setTimeout(resolve, TIMEOUT_500)),
      ])

      setForm((prev) => ({
        ...prev,
        value: value,
        address: address,
        errorMessage: address === inValidAddress ? `${value} is not registered yet` : '',
        isValid: address !== inValidAddress,
        isLoading: false,
      }))
    } catch {
      await new Promise((resolve) => setTimeout(resolve, TIMEOUT_500))

      setForm((prev) => ({
        ...prev,
        errorMessage: `Failed to resolve ${value}`,
        isValid: false,
        isLoading: false,
      }))
    }
  }

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    if (!value.trim()) {
      setForm({
        value: '',
        address: '',
        isValid: false,
        errorMessage: '',
        isLoading: false,
      })
      return
    }

    setForm((prev) => ({ ...prev, value }))

    if (value.endsWith('.hl')) {
      debounceTimerRef.current = setTimeout(() => {
        resolveHlName(value)
      }, TIMEOUT_500)
    } else {
      const isValidAddress = addressRegex.test(value)
      let errorMessage = ''
      if (!isValidAddress) {
        errorMessage = 'Please enter valid wallet address'
      }

      setForm((prev) => ({
        ...prev,
        value: value,
        address: isValidAddress ? value : '',
        isValid: isValidAddress,
        errorMessage: errorMessage,
        isLoading: false,
      }))
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 sm:gap-9 px-4">
      <div className="shrink-0">
        <Image src={OtomatoLogo} width="134" height="40" alt="otomato-logo" className="w-24 h-auto sm:w-[134px] sm:h-10" />
      </div>

      <div className="flex flex-col gap-4 sm:gap-6">
        <h1 className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold gradient-text px-4">Hyperliquid wrapped 2025</h1>
        <p className="text-center text-base sm:text-lg md:text-xl leading-7 sm:leading-10 md:leading-12 text-rgba255-630 px-4">
          To celebrate Hype&apos;s 1 year anniversary, we decided to create a unique experience.
        </p>
      </div>

      <div className="w-full max-w-[27.5rem] sm:w-110 flex flex-col gap-3">
        <div className="relative h-12 sm:h-15 flex justify-center" suppressHydrationWarning>
          {isMounted ? (
            <>
              <input
                placeholder="Paste your address to start"
                value={form.value}
                className="w-full h-full py-3 sm:py-4 pl-4 sm:pl-6 pr-12 sm:pr-16 rounded-full text-sm sm:text-base border border-rgba255-300 bg-rgba110-100 focus:border-cyan-50d focus:outline-none transition-all duration-300"
                onChange={onInputChange}
                suppressHydrationWarning
              />
              <Button
                variant="cyan"
                className="h-8 w-8 sm:h-10 sm:w-10 p-2 rounded-full absolute right-2 sm:right-3 top-1/2 -translate-y-1/2"
                leftIcon={<Image width={14} height={14} className="sm:w-4 sm:h-4" src={SendIcon} alt="send-icon" />}
                onClick={() => {
                  // Store wallet address in localStorage before submitting
                  if (form.address) {
                    localStorage.setItem('wallet', form.address)
                  }
                  onSubmit()
                }}
                disabled={!form.isValid || form.isLoading}
              />
            </>
          ) : (
            <div className="w-full h-full py-3 sm:py-4 pl-4 sm:pl-6 pr-12 sm:pr-16 rounded-full text-sm sm:text-base border border-rgba255-300 bg-rgba110-100" />
          )}
        </div>

        {/* Message container with fixed height to prevent layout shift */}
        <div className="min-h-8 overflow-hidden">
          {/* Display loading state */}
          {form.isLoading && (
            <div className="px-4 sm:px-6 text-xs sm:text-sm text-rgba255-630 flex items-center gap-2 animate-slide-down">
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-rgba255-300 border-t-white-100 rounded-full animate-spin shrink-0" />
              <div className="break-words">
                Resolving <span className="text-green-100 font-medium break-all">{form.value}</span> ...
              </div>
            </div>
          )}

          {/* Display converted address when HL name is valid */}
          {!form.isLoading &&
            form.value.endsWith('.hl') &&
            form.address &&
            form.address !== inValidAddress && (
              <div className="px-4 sm:px-6 text-xs sm:text-sm text-rgba255-630 flex items-start sm:items-center gap-2 animate-slide-down flex-wrap">
                <span className="text-rgba255-600 shrink-0">Address: </span>
                <span className="text-green-100 text-xs sm:text-sm font-medium break-all">{form.address}</span>
              </div>
            )}

          {/* Display error message */}
          {!form.isLoading && form.errorMessage && (
            <div className="px-4 sm:px-6 text-xs sm:text-sm text-red-100 animate-slide-down break-words">{form.errorMessage}</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(GetStarted)
