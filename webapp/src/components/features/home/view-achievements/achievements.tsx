'use client'

import { Button } from '@/components/ui/button'
import TelegramLogo from '@/public/icons/ic-telegram-logo.svg'
import OtomatoLogo from '@/public/images/img-otomato-logo-v3@2x.png'
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@heroui/modal'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { memo, useState } from 'react'
import { EAchievementStep, TOTAL_STEP } from '../constants'
import ActiveAddresses from './active-addresses'
import GridAchievements from './grid-achievements'
import InteractedProjects from './interacted-projects'
import ProjectAchievements from './project-achievements'
import ShareOnX from './share-on-x'
import TextAchievements from './text-achievements'

const ViewArchives = () => {
  const [step, setStep] = useState(EAchievementStep.TEXT_ACHIEVEMENTS)
  const [animatedSteps, setAnimatedSteps] = useState(new Set([EAchievementStep.TEXT_ACHIEVEMENTS]))
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleStepChange = (newStep: number) => {
    setStep(newStep)
    setAnimatedSteps((prev) => new Set(prev).add(newStep))
  }

  const getAnimationKey = (stepValue: number) =>
    animatedSteps.has(stepValue) ? `animated-${stepValue}` : `initial-${stepValue}`

  // Modal disabled for now
  // useEffect(() => {
  //   if (step === EAchievementStep.TEXT_ACHIEVEMENTS) {
  //     setIsModalOpen(true)
  //   }
  // }, [step])

  return (
    <>
      <div className="w-full h-screen flex items-center gap-10 py-12">
        <div className="shrink">
          <Button
            variant="cyan"
            className="w-15 h-15 rounded-full"
            disabled={step === EAchievementStep.TEXT_ACHIEVEMENTS}
            leftIcon={<ChevronLeft />}
            onClick={() => setStep(step - 1)}
          />
        </div>

        <div className="grow max-w-75rem h-full flex items-center">
          {(() => {
            switch (step) {
              case EAchievementStep.TEXT_ACHIEVEMENTS:
                return (
                  <TextAchievements key={getAnimationKey(EAchievementStep.TEXT_ACHIEVEMENTS)} />
                )

              case EAchievementStep.GRID_ACHIEVEMENTS:
                return (
                  <GridAchievements key={getAnimationKey(EAchievementStep.GRID_ACHIEVEMENTS)} />
                )

              case EAchievementStep.INTERACTED_PROJECTS:
                return (
                  <InteractedProjects key={getAnimationKey(EAchievementStep.INTERACTED_PROJECTS)} />
                )

              case EAchievementStep.ACCUMULATED_POINTS:
                return (
                  <ProjectAchievements key={getAnimationKey(EAchievementStep.ACCUMULATED_POINTS)} />
                )

              case EAchievementStep.ACTIVE_ADDRESSES:
                return <ActiveAddresses key={getAnimationKey(EAchievementStep.ACTIVE_ADDRESSES)} />

              case EAchievementStep.SHARE_ON_X:
                return <ShareOnX key={getAnimationKey(EAchievementStep.SHARE_ON_X)} />

              default:
                return null
            }
          })()}
        </div>

        <div className="shrink">
          <Button
            variant="cyan"
            className="w-15 h-15 rounded-full"
            leftIcon={<ChevronRight />}
            disabled={step === TOTAL_STEP}
            onClick={() => handleStepChange(step + 1)}
          />
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        size="sm"
        scrollBehavior="inside"
        hideCloseButton
        classNames={{
          backdrop: 'backdrop-blur-md',
          base: 'w-[28.6rem] h-auto max-h-[90vh] flex flex-col gap-7 bg-rgba80-210-193-290 rounded-[3rem] p-9 outline-none',
          wrapper: 'items-center',
          header: 'p-0',
          body: 'p-0 max-h-none overflow-visible',
          footer: 'p-0 justify-center',
        }}
      >
        <ModalContent className="h-auto">
          <ModalHeader className="flex justify-center">
            <Image src={OtomatoLogo} alt="Otomato logo" width={134} height={40} priority />
          </ModalHeader>

          <ModalBody>
            <p className="text-xl text-center font-semibold leading-10">
              Launch the Otomato HyperEVM assistant in order to access the experience!
            </p>

            <div className="flex flex-col gap-4">
              <p className="text-center font-semibold">Example</p>
              <p className="rounded-3xl text-center text-lg font-semibold leading-9 p-3 border border-rgba255-300 bg-rgba200-200-200-200">
                Hey, you just received 1,000 hearts on Hyperbeat this week
              </p>
            </div>
          </ModalBody>

          <ModalFooter>
            {/* <Link
              href="https://t.me/OtomatoBot?start=agent_noti-hyperevm_w_unknown"
              target="_blank"
              rel="noopener noreferrer"
            > */}
              <Button
                variant="cyan"
                className="bg-blue-009! rounded-full"
                leftIcon={<Image src={TelegramLogo} alt="Telegram logo" width={24} height={24} />}
                onClick={() => setIsModalOpen(false)}
              >
                Launch now, it&apos;s free
              </Button>
            {/* </Link> */}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export default memo(ViewArchives)
