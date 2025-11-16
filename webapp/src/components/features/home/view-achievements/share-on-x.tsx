import { Button } from '@/components/ui/button'
import { useTypewriter } from '@/hooks/use-typewriter'
import { cn } from '@/lib/utils'
import DownloadIcon from '@/public/icons/ic-download.svg'
import SendIcon from '@/public/icons/ic-send.svg'
import NFTImage from '@/public/images/HyperliquidXOtomato.png'
import Image from 'next/image'
import { memo, useRef, useState, useEffect, useMemo } from 'react'
import { MintButton } from '@/components/ui/mint-button'
import { Spinner } from '@heroui/react'

const HEADER_TEXT = 'Share on X to mint the Otomato x HyperEVM commemorative NFT'

const ShareOnX = () => {
  const [showContent, setShowContent] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasSharedOnX, setHasSharedOnX] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const hasGeneratedRef = useRef(false)

  // Get user data from localStorage
  const userData = useMemo(() => {
    if (typeof window === 'undefined') {
      return null
    }

    const walletAddress = localStorage.getItem('wallet')
    if (!walletAddress) {
      return null
    }

    const userDataStr = localStorage.getItem(`wallet-${walletAddress}`)
    if (!userDataStr) {
      return null
    }

    try {
      return JSON.parse(userDataStr)
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
      return null
    }
  }, [])

  const headerText = HEADER_TEXT
  const { visibleSegments } = useTypewriter({
    segments: [{ text: headerText, isHighlight: false }],
    speed: 30,
    onComplete: () => {
      setTimeout(() => setShowContent(true), 300)
    },
  })

  // Check localStorage on mount to see if user has already shared
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const shared = localStorage.getItem('hasSharedOnX');
      if (shared === 'true') {
        setHasSharedOnX(true);
      }
    }
  }, [])

  // Generate image from API when user data is available
  useEffect(() => {
    if (!userData || hasGeneratedRef.current) return;

    const generateImage = async () => {
      hasGeneratedRef.current = true;

      try {
        setIsGeneratingImage(true);
        console.log('Generating image with payload:', userData);

        // Prepare the request payload
        const payload = {
          rank: userData.rank,
          avatar: userData.avatar,
          userBadge: userData.userBadge,
          protocolBadges: userData.protocolBadges,
          topPoints: userData.topPoints,
          general: userData.general,
        };

        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const requestOptions = {
          method: "POST",
          headers: myHeaders,
          body: JSON.stringify(payload),
          redirect: "follow" as RequestRedirect
        };

        console.log('Fetching image from API...');
        const response = await fetch("http://localhost:3002/generate-image", requestOptions);

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Check content type
        const contentType = response.headers.get("content-type");
        console.log('Response content-type:', contentType);

        let imageUrl: string | null = null;

        if (contentType && contentType.includes("application/json")) {
          // JSON response
          const jsonResult = await response.json();
          console.log('JSON response:', jsonResult);
          imageUrl = jsonResult.url || jsonResult.imageUrl || jsonResult.data || jsonResult.image;
        } else if (contentType && contentType.includes("image/")) {
          // Binary image response
          const blob = await response.blob();
          imageUrl = URL.createObjectURL(blob);
          console.log('Created blob URL from binary response');
        } else {
          // Try as text (might be base64 or URL string)
          const textResult = await response.text();
          console.log('Text response length:', textResult.length);

          // Check if it's a base64 string
          if (textResult.startsWith('data:image') || textResult.startsWith('/9j/') || textResult.startsWith('iVBORw0KGgo')) {
            // It's already a data URL or base64, use it directly
            imageUrl = textResult.startsWith('data:') ? textResult : `data:image/png;base64,${textResult}`;
          } else {
            // Try to parse as JSON
            try {
              const jsonResult = JSON.parse(textResult);
              imageUrl = jsonResult.url || jsonResult.imageUrl || jsonResult.data || jsonResult.image;
            } catch {
              // If it's not JSON, treat it as a URL
              imageUrl = textResult.trim();
            }
          }
        }

        if (imageUrl) {
          console.log('Setting generated image URL:', imageUrl.substring(0, 100) + '...');
          setGeneratedImageUrl(imageUrl);
        } else {
          console.warn('No image URL found in response');
        }
      } catch (error) {
        console.error("Failed to generate image:", error);
        // Fallback to static image on error
      } finally {
        setIsGeneratingImage(false);
      }
    };

    generateImage();
  }, [userData])

  const handleDownload = async () => {
    if (isDownloading || !generatedImageUrl) return;

    try {
      setIsDownloading(true);

      // Use generated image if available, otherwise fallback to static image
      const imageToDownload = generatedImageUrl;

      // Fetch the image
      const response = await fetch(imageToDownload);
      const blob = await response.blob();

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `otomato-card-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsDownloading(false);
    } catch (err) {
      console.error("Download failed:", err);
      setIsDownloading(false);
    }
  };

  const handleShareOnX = () => {
    // Generate dynamic tweet text based on user data
    let tweetText = ""

    if (userData) {
      const rank = userData.rank
      const formattedRank = typeof rank === 'number'
        ? rank.toLocaleString(undefined, { maximumFractionDigits: 0 })
        : rank

      const topProject = userData.topPoints?.[0]
      const protocolCount = userData.protocolBadges?.length || 0
      const archetype = userData.general?.archetype || ""

      // Build engaging tweet text
      tweetText = `Just ranked #${formattedRank} on HyperEVM! 🚀`

      if (topProject) {
        // Format project name properly
        let projectName = topProject.icon || ""
        if (projectName === "HypioNFTS") projectName = "HypioNFTS"
        else if (projectName === "HypurrNFTS") projectName = "HypurrNFTS"
        else if (projectName === "hlnames") projectName = "HLNames"
        else if (projectName === "gliquid") projectName = "GLiquid"
        else projectName = projectName.charAt(0).toUpperCase() + projectName.slice(1)

        const label = topProject.label || ""
        tweetText += `\n\n${label} on ${projectName}`
      }

      if (protocolCount > 0) {
        tweetText += `\n\nExplored ${protocolCount} protocols & minted my commemorative NFT on Otomato 🍅`
      } else {
        tweetText += `\n\nMinted my commemorative NFT on Otomato 🍅`
      }

      if (archetype) {
        tweetText += `\n\n${archetype} 💎`
      }

      tweetText += `\n\n#HyperEVM #Otomato #Hyperliquid`
    } else {
      // Fallback text if no user data
      tweetText = "Just minted my commemorative NFT on Otomato! 🍅\n\n#HyperEVM #Otomato #Hyperliquid"
    }

    const text = encodeURIComponent(tweetText)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank")

    // Mark as shared when user clicks the share button
    // Note: We can't verify if they actually completed the share, but we'll enable minting
    // when they click the share button (assuming they will share)
    setHasSharedOnX(true);

    // Store in localStorage to persist across page refreshes
    if (typeof window !== 'undefined') {
      localStorage.setItem('hasSharedOnX', 'true');
    }
  }

  const blockBaseClass = 'transition-all duration-700 ease-out'
  const hiddenClass = 'opacity-0 scale-95 translate-y-4'
  const visibleClass = 'opacity-100 scale-100 translate-y-0'
  return (
    <div className="w-full h-auto flex flex-col gap-10 relative">
      <div className="w-5xl shrink relative">
        {/* Invisible full text to reserve space */}
        <div className="opacity-0 pointer-events-none" aria-hidden="true">
          <p className="text-4xl text-center font-bold leading-16">{headerText}</p>
        </div>

        {/* Visible typewriter text positioned absolutely */}
        <div className="absolute top-0 left-0 w-full">
          <p className="text-4xl text-center font-bold leading-16">
            {visibleSegments.map((segment, index) => (
              <span key={index} className="text-4xl font-bold leading-16">
                {segment.visibleText}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="grow flex items-stretch gap-20">
        <div
          className={cn(
            'flex-[3] flex flex-col gap-10',
            blockBaseClass,
            showContent ? visibleClass : hiddenClass,
          )}
          style={{ transitionDelay: '0ms' }}
        >

          <div
            ref={cardRef}
            className="w-full aspect-video relative rounded-4xl border border-cyan-50d overflow-hidden"
            style={{ paddingTop: '100px', paddingBottom: '100px', paddingLeft: '100px', paddingRight: '100px' }}
          >
            {isGeneratingImage ? (
              <div className="absolute inset-0 flex items-center justify-center bg-rgba80-80-80-210 rounded-4xl">
                <Spinner size="lg" />
              </div>
            ) : generatedImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={generatedImageUrl}
                alt="background-image"
                className="absolute inset-0 w-full h-full object-cover rounded-4xl"
                onError={(e) => {
                  console.error('Image failed to load:', generatedImageUrl);
                  console.error('Error event:', e);
                  // Fallback to static image on error
                  setGeneratedImageUrl(null);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully');
                }}
              />
            ) : (
              <></>
            )}
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <Button
              variant="secondary"
              className="w-48 h-12 bg-rgba80-80-80-210 rounded-full text-base font-medium"
              leftIcon={
                isDownloading ? (<></>) : (<Image
                  src={DownloadIcon}
                  width={24}
                  height={24}
                  alt="download-icon"
                  className="w-6 h-6"
                />)
              }
              onClick={handleDownload}
              disabled={isDownloading}
            >
              {isDownloading ? 'Downloading...' : 'Download Image'}
            </Button>

            <Button
              variant="cyan"
              className="w-36 h-12 rounded-full text-base font-medium"
              leftIcon={
                <Image src={SendIcon} width={24} height={24} alt="send-icon" className="w-6 h-6" />
              }
              onClick={handleShareOnX}
            >
              Share
            </Button>

          </div>
        </div>
        <div
          className={cn(
            'flex-[1] flex flex-col gap-10 justify-center items-center',
            blockBaseClass,
            showContent ? visibleClass : hiddenClass,
          )}
          style={{ transitionDelay: '100ms' }}
        >
          <div className="w-64 h-64 relative">
            <Image src={NFTImage} alt="anime-image" fill className="object-cover rounded-4xl" />
            {/* {!hasSharedOnX && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-md rounded-4xl z-10" />
            )} */}
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <MintButton disabled={!hasSharedOnX} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ShareOnX)
