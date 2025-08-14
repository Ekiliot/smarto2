'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { X, Heart, MessageCircle, Share2, ShoppingCart } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useCart } from '@/components/CartProvider'
import { useWishlist } from '@/components/WishlistProvider'
import { useNotification } from '@/components/NotificationProvider'
import { ReviewMedia, ProductReview } from '@/lib/types/reviews'
import { createReaction, deleteUserReaction, getUserReaction } from '@/lib/supabase/reviews'
import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'

interface MediaViewerProps {
  isOpen: boolean
  onClose: () => void
  media: ReviewMedia
  review: ProductReview
  productName: string
  allReviews: ProductReview[] // Все отзывы для прокрутки
  currentReviewIndex: number // Индекс текущего отзыва
  onReviewChange: (index: number) => void // Функция смены отзыва
  onOpenComments: (review: any) => void
  allProducts?: any[] // Все товары для показа после отзывов
}

export default function MediaViewer({ 
  isOpen, 
  onClose, 
  media, 
  review, 
  productName,
  allReviews,
  currentReviewIndex,
  onReviewChange,
  onOpenComments,
  allProducts
}: MediaViewerProps) {
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { wishlistItems, addToWishlist, removeFromWishlist, isInWishlist: checkIsInWishlist } = useWishlist()
  const { showNotification } = useNotification()
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(review.total_likes || 0)

  const [showFullTextModal, setShowFullTextModal] = useState(false)
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [isShowingProducts, setIsShowingProducts] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  
  const modalRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const dragFromButtonsRef = useRef(false)

  // Получаем все медиа файлы отзыва
  const allMedia = review.media || []
  const currentMedia = allMedia[currentMediaIndex]
  
  // Проверяем, есть ли медиа у отзыва
  const hasMedia = allMedia && allMedia.length > 0
  
  // Фильтруем только отзывы с медиа
  const reviewsWithMedia = allReviews.filter(review => review.media && review.media.length > 0)
  const hasReviewsWithMedia = reviewsWithMedia.length > 0
  
  // Проверяем, что текущий отзыв валиден
  const isValidReviewIndex = currentReviewIndex >= 0 && currentReviewIndex < reviewsWithMedia.length
  const shouldShowReview = hasMedia && isValidReviewIndex && review && review.id && !isShowingProducts
  
  // Получаем текущий товар и его медиа
  const currentProduct = allProducts?.[currentProductIndex]
  // Формируем массив изображений как на странице товара
  const currentProductImages = currentProduct ? [
    currentProduct.image_url, // Главное изображение
    ...(currentProduct.images || []) // Дополнительные изображения
  ].filter(Boolean) : [] // Убираем пустые значения
  
  const [currentProductMediaIndex, setCurrentProductMediaIndex] = useState(0)

  // Сбрасываем индекс медиа при смене товара
  useEffect(() => {
    setCurrentProductMediaIndex(0)
  }, [currentProductIndex])

  // Отладочная информация для отзывов
  useEffect(() => {
    if (isOpen && !isShowingProducts) {
      console.log('Показываем отзывы:', {
        currentReviewIndex,
        allReviewsLength: allReviews.length,
        reviewsWithMediaLength: reviewsWithMedia.length,
        hasMedia,
        currentReview: review
      })
    }
  }, [isOpen, isShowingProducts, currentReviewIndex, allReviews.length, reviewsWithMedia.length, hasMedia, review])

  // Отладочная информация для изображений товара
  useEffect(() => {
    if (currentProduct && isShowingProducts) {
      console.log('Текущий товар:', {
        name: currentProduct.name,
        id: currentProduct.id,
        image_url: currentProduct.image_url,
        images: currentProduct.images,
        currentProductImages,
        currentProductMediaIndex,
        hasMultipleImages: currentProductImages.length > 1,
        currentImageUrl: currentProductImages[currentProductMediaIndex]
      })
    }
  }, [currentProduct, isShowingProducts, currentProductImages, currentProductMediaIndex])

  // Проверяем, есть ли у товара несколько изображений
  const hasMultipleProductImages = currentProductImages.length > 1

  // Управляем скролл при открытии/закрытии
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && user && review.id) {
      loadUserReaction()
    }
  }, [isOpen, user, review.id]) // Зависимость только от ID отзыва и пользователя

  // Обновляем likeCount когда меняется отзыв
  useEffect(() => {
    if (review && review.id) {
      // Сбрасываем состояние для нового отзыва
      setIsLiked(false)
      setLikeCount(review.total_likes || 0)
      
      console.log('📊 Review changed, updating like state:', {
        reviewId: review.id,
        total_likes: review.total_likes,
        newLikeCount: review.total_likes || 0,
        resettingIsLiked: true
      })
      
      // Загружаем реакцию пользователя для нового отзыва
      if (user) {
        loadUserReaction()
      }
    }
  }, [review?.id, user])

  // Инициализация при открытии модального окна
  useEffect(() => {
    if (isOpen && !isInitialized) {
      console.log('🚀 Инициализация MediaViewer')
      // Показываем отзывы по умолчанию, если они есть с медиа
      if (hasReviewsWithMedia) {
        setIsShowingProducts(false)
        // Убеждаемся, что currentReviewIndex валиден
        if (currentReviewIndex < 0 || currentReviewIndex >= reviewsWithMedia.length) {
          console.log('Исправляем невалидный currentReviewIndex:', currentReviewIndex, '-> 0')
          onReviewChange(0)
        }
      }
      // Переходим к товарам только если нет отзывов с медиа вообще
      else if (!hasReviewsWithMedia && allProducts && allProducts.length > 0) {
        console.log('Нет отзывов с медиа, показываем товары')
        setIsShowingProducts(true)
        setCurrentProductIndex(0)
      }
      setIsInitialized(true)
    } else if (!isOpen) {
      // Сбрасываем инициализацию при закрытии
      setIsInitialized(false)
    }
  }, [isOpen, isInitialized, hasReviewsWithMedia, allProducts, currentReviewIndex, reviewsWithMedia.length, onReviewChange])

  const loadUserReaction = async () => {
    try {
      if (review.id) {
        console.log('🔄 Loading user reaction for review:', {
          reviewId: review.id,
          currentLikeCount: likeCount,
          reviewTotalLikes: review.total_likes
        })
        
        const reaction = await getUserReaction(review.id)
        const userLiked = reaction === 'like'
        setIsLiked(userLiked)
        
        // Если пользователь лайкнул, но счетчик 0 или отрицательный — показываем минимум 1
        if (userLiked && (!review.total_likes || review.total_likes < 1)) {
          setLikeCount(1)
        }
        
        console.log('✅ User reaction loaded:', {
          reaction,
          isLiked: userLiked,
          reviewTotalLikes: review.total_likes
        })
      }
    } catch (error) {
      console.error('Error loading user reaction:', error)
    }
  }

  const handleLike = async () => {
    if (!user || !review.id) return

    console.log('❤️ Handle like called:', {
      isLiked,
      currentLikeCount: likeCount,
      reviewId: review.id,
      reviewTotalLikes: review.total_likes
    })

    try {
      if (isLiked) {
        await deleteUserReaction(review.id)
        const newCount = Math.max(0, likeCount - 1)
        setLikeCount(newCount)
        setIsLiked(false)
        console.log('👎 Like removed:', { newCount })
      } else {
        await createReaction({
          review_id: review.id,
          reaction_type: 'like'
        })
        const newCount = likeCount + 1
        setLikeCount(newCount)
        setIsLiked(true)
        console.log('👍 Like added:', { newCount })
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleAddToCart = (product: any) => {
    console.log('🛒 handleAddToCart called with product:', product)
    if (product && product.id) {
      addToCart(product.id, 1)
      // Показываем iOS-стиль уведомление
      showNotification({
        type: 'success',
        title: 'Товар добавлен в корзину',
        message: product.name,
        icon: 'cart'
      })
      console.log('✅ Product added to cart successfully')
    } else {
      console.error('❌ Invalid product:', product)
    }
  }

  const handleWishlistToggle = async (product: any) => {
    console.log('❤️ handleWishlistToggle called with product:', product)
    if (product && product.id) {
      const isInWishlistNow = checkIsInWishlist(product.id)
      console.log('Is in wishlist check:', { isInWishlistNow, wishlistItems: wishlistItems.length })
      
      try {
        if (isInWishlistNow) {
          await removeFromWishlist(product.id)
          showNotification({
            type: 'info',
            title: 'Удалено из избранного',
            message: product.name,
            icon: 'heart'
          })
          console.log('✅ Product removed from wishlist')
        } else {
          await addToWishlist(product.id)
          showNotification({
            type: 'success',
            title: 'Добавлено в избранное',
            message: product.name,
            icon: 'heart'
          })
          console.log('✅ Product added to wishlist')
        }
      } catch (error: any) {
        console.error('❌ Wishlist error:', error)
        // Если товар уже в wishlist (код 23505), то просто обновляем UI
        if (error?.code === '23505') {
          showNotification({
            type: 'info',
            title: 'Товар уже в избранном',
            message: product.name,
            icon: 'heart'
          })
        } else {
          showNotification({
            type: 'error',
            title: 'Ошибка',
            message: 'Не удалось обновить избранное'
          })
        }
      }
    } else {
      console.error('❌ Invalid product:', product)
    }
  }

  const handleShareProduct = (product: any) => {
    console.log('📤 handleShareProduct called with product:', product)
    if (product && product.id) {
      const productUrl = `${window.location.origin}/product/${product.id}`
      navigator.clipboard.writeText(productUrl).then(() => {
        showNotification({
          type: 'success',
          title: 'Ссылка скопирована',
          message: 'Поделитесь товаром с друзьями',
          icon: 'check'
        })
        console.log('✅ Product link copied successfully')
      }).catch(() => {
        showNotification({
          type: 'error',
          title: 'Ошибка',
          message: 'Не удалось скопировать ссылку'
        })
        console.error('❌ Failed to copy product link')
      })
    } else {
      console.error('❌ Invalid product:', product)
    }
  }

  const handleShareReview = () => {
    if (review && review.id) {
      const reviewUrl = `${window.location.origin}/product/${review.product_id}#review-${review.id}`
      navigator.clipboard.writeText(reviewUrl).then(() => {
        showNotification({
          type: 'success',
          title: 'Ссылка на отзыв скопирована',
          message: 'Поделитесь отзывом с друзьями',
          icon: 'check'
        })
      }).catch(() => {
        showNotification({
          type: 'error',
          title: 'Ошибка',
          message: 'Не удалось скопировать ссылку'
        })
      })
    }
  }

  const isInWishlist = (product: any) => {
    if (!product || !product.id) {
      console.log('❌ isInWishlist: invalid product', product)
      return false
    }
    
    // Используем функцию из WishlistProvider
    const result = checkIsInWishlist(product.id)
    console.log('🔍 isInWishlist check:', {
      productId: product.id,
      productName: product.name,
      result,
      wishlistCount: wishlistItems.length,
      usingProviderFunction: true
    })
    
    return result
  }

  const calculateDiscount = (oldPrice: number, newPrice: number) => {
    if (oldPrice && newPrice && oldPrice > newPrice) {
      return Math.round(((oldPrice - newPrice) / oldPrice) * 100)
    }
    return 0
  }

  const nextMedia = () => {
    if (currentMediaIndex < allMedia.length - 1) {
      setCurrentMediaIndex(prev => prev + 1)
    }
  }

  const prevMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1)
    }
  }

  const nextProductMedia = () => {
    if (hasMultipleProductImages && currentProductMediaIndex < currentProductImages.length - 1) {
      setCurrentProductMediaIndex(prev => prev + 1)
      console.log('Следующее изображение товара:', currentProductMediaIndex + 1)
    }
  }

  const prevProductMedia = () => {
    if (hasMultipleProductImages && currentProductMediaIndex > 0) {
      setCurrentProductMediaIndex(prev => prev - 1)
      console.log('Предыдущее изображение товара:', currentProductMediaIndex - 1)
    }
  }

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (dragFromButtonsRef.current) {
      dragFromButtonsRef.current = false
      return
    }
    // Проверяем, не началось ли событие drag из области кнопок
    const target = event.target as HTMLElement
    const isButtonOrChild = target.closest('button') || 
                           target.closest('[data-action-buttons]') ||
                           target.closest('[data-no-drag]') ||
                           target.tagName === 'BUTTON'
    
    if (isButtonOrChild) {
      dragFromButtonsRef.current = false
      return
    }

    // Также игнорируем очень маленькие движения (возможные случайные клики)
    if (Math.abs(info.offset.y) < 10 && Math.abs(info.offset.x) < 10) {
      console.log('🚫 Drag ignored - too small movement')
      return
    }

    console.log('Drag ended:', {
      offsetY: info.offset.y,
      isShowingProducts,
      currentReviewIndex,
      allReviewsLength: allReviews.length,
      reviewsWithMediaLength: reviewsWithMedia.length,
      currentProductIndex,
      allProductsLength: allProducts?.length,
      hasMedia,
      dragSource: target.tagName
    })

    // Если нет отзывов с медиа, но есть товары - показываем товары
    if (!isShowingProducts && !hasReviewsWithMedia && allProducts && allProducts.length > 0) {
      console.log('Нет отзывов с медиа, показываем товары!')
      setIsShowingProducts(true)
      setCurrentProductIndex(0)
      return
    }

    if (isShowingProducts) {
      // Если показываем товары
      if (info.offset.y < -50 && currentProductIndex < (allProducts?.length || 0) - 1) {
        // Свайп вверх - следующий товар
        setCurrentProductIndex(prev => prev + 1)
      } else if (info.offset.y > 50 && currentProductIndex > 0) {
        // Свайп вниз - предыдущий товар
        setCurrentProductIndex(prev => prev - 1)
      } else if (info.offset.y > 50 && currentProductIndex === 0) {
        // Свайп вниз на первом товаре - возвращаемся к отзывам
        if (hasReviewsWithMedia) {
          console.log('Возвращаемся к отзывам!')
          setIsShowingProducts(false)
          onReviewChange(reviewsWithMedia.length - 1) // Переходим к последнему отзыву с медиа
        }
      } else if (info.offset.y > 120) {
        // Свайп вниз сильно - закрыть
        onClose()
      }
    } else {
      // Если показываем отзывы (только с медиа)
      if (info.offset.y < -50 && currentReviewIndex < reviewsWithMedia.length - 1) {
        // Свайп вверх - следующий отзыв с медиа
        onReviewChange(currentReviewIndex + 1)
      } else if (info.offset.y > 50 && currentReviewIndex > 0) {
        // Свайп вниз - предыдущий отзыв с медиа
        onReviewChange(currentReviewIndex - 1)
      } else if (info.offset.y < -50 && currentReviewIndex >= reviewsWithMedia.length - 1 && allProducts && allProducts.length > 0) {
        // После последнего отзыва с медиа - переходим к товарам
        console.log('Переходим к товарам!')
        setIsShowingProducts(true)
        setCurrentProductIndex(0)
      } else if (info.offset.y > 120) {
        // Свайп вниз сильно - закрыть
        onClose()
      }
    }
  }

  const handleClose = () => {
    onClose()
    setCurrentMediaIndex(0)
    setCurrentProductMediaIndex(0)
    setIsShowingProducts(false)
    setCurrentProductIndex(0)
    setIsInitialized(false)
  }

  // Показываем только если есть медиа или товары
  if (!shouldShowReview && !isShowingProducts) return null

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black"
            onClick={handleClose}
          >
            <motion.div
              ref={modalRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              dragDirectionLock
              style={{ touchAction: 'pan-y' }}
              onPointerDownCapture={(e) => {
                const target = e.target as HTMLElement
                const isButtons = !!(target.closest('button') || target.closest('[data-action-buttons]') || target.closest('[data-no-drag]'))
                dragFromButtonsRef.current = isButtons
                // Полностью блокируем drag если начинается из области кнопок
                if (isButtons) {
                  e.stopPropagation()
                  e.preventDefault()
                }
              }}
              onDragEnd={handleDragEnd}
              className="relative w-full h-full bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Контейнер для горизонтальных свайпов по изображениям товара */}
              {isShowingProducts && currentProduct && hasMultipleProductImages && (
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -100, right: 100 }}
                  dragElastic={0.2}
                  dragPropagation={true}
                  onDragEnd={(event, info) => {
                    if (info.offset.x < -50 && currentProductMediaIndex < currentProductImages.length - 1) {
                      nextProductMedia()
                    } else if (info.offset.x > 50 && currentProductMediaIndex > 0) {
                      prevProductMedia()
                    }
                  }}
                  className="absolute inset-0 z-10"
                />
              )}
              {/* Кнопка закрытия */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 z-20 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Индикатор типа контента */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/50 rounded-full px-4 py-2 text-white text-sm font-medium">
                  {isShowingProducts ? 'Товары' : 'Отзывы'}
                </div>
              </div>

              {/* Прогресс-бар */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
                <div className="bg-black/30 rounded-full h-1 w-32 overflow-hidden">
                  <div 
                    className="bg-white h-full transition-all duration-300"
                    style={{ 
                      width: isShowingProducts 
                        ? `${((currentProductIndex + 1) / (allProducts?.length || 1)) * 100}%`
                        : `${((currentReviewIndex + 1) / (reviewsWithMedia.length || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Основной контент */}
              <div className="relative w-full h-full flex items-center justify-center p-4 bg-gray-900">
                {isShowingProducts ? (
                  /* Показываем товар */
                  currentProduct && (
                    <>
                      <motion.img
                        src={currentProductImages.length > 0 ? currentProductImages[currentProductMediaIndex] : currentProduct.image_url}
                        alt={currentProduct.name}
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        dragPropagation={true}
                        onDragEnd={(event, info) => {
                          if (info.offset.x < -50 && currentProductMediaIndex < currentProductImages.length - 1) {
                            nextProductMedia()
                          } else if (info.offset.x > 50 && currentProductMediaIndex > 0) {
                            prevProductMedia()
                          }
                        }}
                      />

                      {/* Только индикатор скидки на изображении (без цены) */}
                      {(() => {
                        const hasDiscount = currentProduct.old_price && currentProduct.old_price > currentProduct.price
                        console.log('Discount indicator check:', {
                          productName: currentProduct.name,
                          old_price: currentProduct.old_price,
                          price: currentProduct.price,
                          hasDiscount,
                          discount: hasDiscount ? calculateDiscount(currentProduct.old_price, currentProduct.price) : calculateDiscount(Math.round(currentProduct.price * 1.2), currentProduct.price)
                        })
                        return hasDiscount || true // Показываем всегда для тестирования
                      })() && (
                        <div className="absolute top-6 left-6 z-20">
                          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            -{currentProduct.old_price 
                              ? calculateDiscount(currentProduct.old_price, currentProduct.price)
                              : calculateDiscount(Math.round(currentProduct.price * 1.2), currentProduct.price)}%
                          </div>
                        </div>
                      )}

                      {/* Навигация по фото товара */}
                      {hasMultipleProductImages && (
                        <>
                          {currentProductMediaIndex > 0 && (
                            <button
                              onClick={prevProductMedia}
                              className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors z-20"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {currentProductMediaIndex < currentProductImages.length - 1 && (
                            <button
                              onClick={nextProductMedia}
                              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors z-20"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}

                      {/* Индикатор фото товара */}
                      {hasMultipleProductImages && (
                        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
                          {currentProductImages.map((image: any, index: number) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentProductMediaIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )
                ) : (
                  /* Показываем отзыв */
                  shouldShowReview ? (
                    <>
                      {currentMedia.media_type === 'image' ? (
                        <img
                          src={currentMedia.media_url}
                          alt="Review media"
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                      ) : (
                        <video
                          ref={videoRef}
                          src={currentMedia.media_url}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          controls
                          autoPlay
                          loop
                          muted
                        />
                      )}

                      {/* Навигация по медиа отзыва */}
                      {allMedia.length > 1 && (
                        <>
                          {currentMediaIndex > 0 && (
                            <button
                              onClick={prevMedia}
                              className="absolute left-6 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                              </svg>
                            </button>
                          )}
                          {currentMediaIndex < allMedia.length - 1 && (
                            <button
                              onClick={nextMedia}
                              className="absolute right-6 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}
                        </>
                      )}

                      {/* Индикатор медиа отзыва */}
                      {allMedia.length > 1 && (
                        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 flex gap-2">
                          {allMedia.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                index === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : null
                )}
              </div>

              {/* Информация - TikTok стиль */}
              <div className="absolute bottom-8 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6">
                {isShowingProducts ? (
                  /* Информация о товаре */
                  currentProduct && (
                    <>
                      {/* Цены и скидка */}
                      <div className="mb-4">
                        {(() => {
                          const hasDiscount = currentProduct.old_price && currentProduct.old_price > currentProduct.price
                          const testOldPrice = Math.round(currentProduct.price * 1.2)
                          const actualDiscount = hasDiscount 
                            ? calculateDiscount(currentProduct.old_price, currentProduct.price)
                            : calculateDiscount(testOldPrice, currentProduct.price)
                          
                          console.log('Product discount calculation:', {
                            name: currentProduct.name,
                            price: currentProduct.price,
                            old_price: currentProduct.old_price,
                            hasDiscount,
                            testOldPrice,
                            actualDiscount
                          })
                          
                          return hasDiscount || true // Показываем всегда для тестирования
                        })() && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white/70 text-sm line-through">
                              {currentProduct.old_price || Math.round(currentProduct.price * 1.2)} MDL
                            </span>
                            <span className="text-red-400 text-sm font-medium bg-red-900/30 px-2 py-1 rounded">
                              -{currentProduct.old_price 
                                ? calculateDiscount(currentProduct.old_price, currentProduct.price)
                                : calculateDiscount(Math.round(currentProduct.price * 1.2), currentProduct.price)}%
                            </span>
                          </div>
                        )}
                        <p className="text-white font-bold text-2xl">
                          {currentProduct.price} MDL
                        </p>
                      </div>

                      {/* Название и бренд товара */}
                      <div className="mb-4">
                        <p className="text-white font-semibold text-lg">
                          {currentProduct.name}
                        </p>
                        {currentProduct.brand && (
                          <p className="text-white/70 text-sm">
                            {currentProduct.brand}
                          </p>
                        )}
                      </div>
                    </>
                  )
                ) : (
                  /* Информация об отзыве */
                  shouldShowReview ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                          {review.user?.image_url ? (
                            <img
                              src={review.user.image_url}
                              alt="Profile"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-medium text-gray-600 dark:text-gray-400">
                              {review.user?.first_name?.[0] || review.user?.last_name?.[0] || review.user?.email?.[0] || 'U'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-semibold text-lg">
                            {review.user?.first_name && review.user?.last_name 
                              ? `${review.user.first_name} ${review.user.last_name}` 
                              : review.user?.email}
                          </p>
                          <p className="text-white/70 text-sm">
                            {formatDistanceToNow(new Date(review.created_at), { 
                              addSuffix: true, 
                              locale: ru 
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Ограниченный текст отзыва */}
                      <div className="mb-4">
                        <p className="text-white text-base leading-relaxed max-w-md break-words overflow-hidden line-clamp-2">
                          {review.text}
                        </p>
                        {review.text.length > 150 && (
                          <button
                            onClick={() => setShowFullTextModal(true)}
                            className="text-blue-400 hover:text-blue-300 text-sm font-medium mt-2 transition-colors"
                          >
                            Смотреть еще
                          </button>
                        )}
                      </div>
                    </>
                  ) : null
                )}
              </div>

              {/* Убрана зона блокировки drag, чтобы восстановить вертикальный скролл */}

              {/* Кнопки действий справа - TikTok стиль с улучшенной видимостью */}
              <div 
                className="absolute right-2 bottom-32 flex flex-col items-center gap-4 pr-1 z-30"
                data-action-buttons="true"
                data-no-drag="true"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                style={{ touchAction: 'none' }}
              >
                {isShowingProducts ? (
                  /* Кнопки для товара */
                  currentProduct && (
                    <>
                      {/* В корзину */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          console.log('🛒 Cart button clicked, currentProduct:', currentProduct)
                          handleAddToCart(currentProduct)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrag={(e) => e.preventDefault()}
                        data-no-drag="true"
                        className="flex flex-col items-center justify-center p-3 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 text-white hover:bg-black/60 hover:scale-110 transition-all duration-200 shadow-lg w-14 h-14"
                        style={{ touchAction: 'none' }}
                      >
                        <ShoppingCart className="w-7 h-7" />
                      </button>

                      {/* Вишлист */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          console.log('❤️ Wishlist button clicked, currentProduct:', currentProduct)
                          handleWishlistToggle(currentProduct)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrag={(e) => e.preventDefault()}
                        data-no-drag="true"
                        className={`flex flex-col items-center justify-center p-3 backdrop-blur-sm rounded-2xl border transition-all duration-200 shadow-lg hover:scale-110 w-14 h-14 ${
                          isInWishlist(currentProduct)
                            ? 'bg-red-500/80 border-red-400/50 text-white'
                            : 'bg-black/40 border-white/20 text-white hover:bg-black/60'
                        }`}
                        style={{ touchAction: 'none' }}
                      >
                        <Heart className={`w-7 h-7 ${isInWishlist(currentProduct) ? 'fill-current' : ''}`} />
                      </button>

                      {/* Поделиться */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          console.log('📤 Share button clicked, currentProduct:', currentProduct)
                          handleShareProduct(currentProduct)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrag={(e) => e.preventDefault()}
                        data-no-drag="true"
                        className="flex flex-col items-center justify-center p-3 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 text-white hover:bg-black/60 hover:scale-110 transition-all duration-200 shadow-lg w-14 h-14"
                        style={{ touchAction: 'none' }}
                      >
                        <Share2 className="w-7 h-7" />
                      </button>
                    </>
                  )
                ) : (
                  /* Кнопки для отзыва */
                  shouldShowReview && (
                    <>
                      {/* Лайк */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleLike()
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrag={(e) => e.preventDefault()}
                        data-no-drag="true"
                        className={`flex flex-col items-center gap-1 p-3 backdrop-blur-sm rounded-2xl border transition-all duration-200 shadow-lg hover:scale-110 ${
                          isLiked
                            ? 'bg-red-500/80 border-red-400/50 text-white'
                            : 'bg-black/40 border-white/20 text-white hover:bg-black/60'
                        }`}
                        style={{ touchAction: 'none' }}
                      >
                        <Heart className={`w-7 h-7 ${isLiked ? 'fill-current' : ''}`} />
                        <span className="text-xs font-medium">{likeCount}</span>
                      </button>

                      {/* Комментарии */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          onOpenComments(review)
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrag={(e) => e.preventDefault()}
                        data-no-drag="true"
                        className="flex flex-col items-center gap-1 p-3 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 text-white hover:bg-black/60 hover:scale-110 transition-all duration-200 shadow-lg"
                        style={{ touchAction: 'none' }}
                      >
                        <MessageCircle className="w-7 h-7" />
                        <span className="text-xs font-medium">{review.comments?.length || 0}</span>
                      </button>

                      {/* Поделиться */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          e.preventDefault()
                          handleShareReview()
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        onDragStart={(e) => e.preventDefault()}
                        onDrag={(e) => e.preventDefault()}
                        data-no-drag="true"
                        className="flex flex-col items-center justify-center p-3 bg-black/40 backdrop-blur-sm rounded-2xl border border-white/20 text-white hover:bg-black/60 hover:scale-110 transition-all duration-200 shadow-lg w-14 h-14"
                        style={{ touchAction: 'none' }}
                      >
                        <Share2 className="w-7 h-7" />
                      </button>
                    </>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Меню поделиться */}
      <AnimatePresence>
        {/* Removed isShareMenuOpen and its related modal */}
      </AnimatePresence>

      {/* Модальное окно с полным текстом отзыва */}
      <AnimatePresence>
        {showFullTextModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-black/50 flex items-end"
            onClick={() => setShowFullTextModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.1}
              onDragEnd={(event, info) => {
                if (info.offset.y > 100) {
                  setShowFullTextModal(false)
                }
              }}
              className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center overflow-hidden">
                      {review.user?.image_url ? (
                        <img
                          src={review.user.image_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {review.user?.first_name?.[0] || review.user?.last_name?.[0] || review.user?.email?.[0] || 'U'}
                        </span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                        {review.user?.first_name && review.user?.last_name 
                          ? `${review.user.first_name} ${review.user.last_name}` 
                          : review.user?.email}
                      </h2>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {formatDistanceToNow(new Date(review.created_at), { 
                          addSuffix: true, 
                          locale: ru 
                        })}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFullTextModal(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Индикатор свайпа */}
                <div className="flex justify-center">
                  <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
                <p className="text-center text-xs text-gray-500 mt-2">
                  Свайп вниз для закрытия
                </p>
              </div>

              {/* Полный текст отзыва */}
              <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-120px)]">
                <p className="text-gray-900 dark:text-white text-base leading-relaxed break-words">
                  {review.text}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  )
} 