export function initCartDrawer() {
  if (typeof window === "undefined" || !window.fetch || !window.Intl || !window.FormData) {
    return
  }

  var drawer = document.getElementById("lw-cart-drawer")
  if (!drawer) {
    return
  }

  var overlay = drawer.querySelector("[data-cart-drawer-overlay]")
  var panel = drawer.querySelector("[data-cart-drawer-panel]")
  var itemsContainer = drawer.querySelector("[data-cart-drawer-items]")
  var emptyState = drawer.querySelector("[data-cart-drawer-empty]")
  var subtotalEl = drawer.querySelector("[data-cart-drawer-subtotal]")
  var closeButtons = drawer.querySelectorAll("[data-cart-drawer-close]")
  var lineTemplate = drawer.querySelector("[data-cart-drawer-line-template]")
  var currency = panel ? panel.getAttribute("data-shop-currency") || "USD" : "USD"
  var formatter = new Intl.NumberFormat(undefined, { style: "currency", currency: currency })
  var isOpen = false
  var lastFocusedElement = null

  function refreshCart() {
    return fetch("/cart.js", { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Cart request failed")
        }
        return response.json()
      })
      .then(function (cart) {
        updateDrawer(cart)
      })
  }

  function setOpenState(open) {
    if (!drawer || !panel) {
      return
    }

    if (open) {
      drawer.setAttribute("aria-hidden", "false")
      drawer.classList.remove("tw:pointer-events-none", "tw:invisible")
      drawer.classList.add("tw:pointer-events-auto", "tw:visible")
      panel.classList.remove("tw:translate-x-full")
      panel.classList.add("tw:translate-x-0")
    } else {
      drawer.classList.add("tw:pointer-events-none")
      drawer.classList.remove("tw:pointer-events-auto")
      panel.classList.add("tw:translate-x-full")
      panel.classList.remove("tw:translate-x-0")
    }
  }

  function setDrawerHidden() {
    if (!drawer) return
    drawer.setAttribute("aria-hidden", "true")
    drawer.classList.remove("tw:visible")
    drawer.classList.add("tw:invisible")
  }

  function openDrawer(cart) {
    lastFocusedElement = document.activeElement
    if (cart) {
      updateDrawer(cart)
    }
    setOpenState(true)
    isOpen = true
    var closeButton = drawer.querySelector("[data-cart-drawer-close]")
    if (closeButton && typeof closeButton.focus === "function") {
      closeButton.focus()
    }
    document.addEventListener("keydown", handleKeydown)
  }

  function closeDrawer() {
    isOpen = false
    document.removeEventListener("keydown", handleKeydown)
    setOpenState(false)

    function onCloseDone() {
      panel.removeEventListener("transitionend", onCloseDone)
      clearTimeout(closeFallback)
      if (isOpen) return
      setDrawerHidden()
      if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus()
      }
    }

    var closeFallback = setTimeout(onCloseDone, 220)
    panel.addEventListener("transitionend", onCloseDone)
  }

  function handleKeydown(event) {
    if (!isOpen) {
      return
    }
    if (event.key === "Escape" || event.key === "Esc") {
      event.preventDefault()
      closeDrawer()
    }
  }

  function updateDrawer(cart) {
    if (!cart || !Array.isArray(cart.items)) {
      return
    }

    if (!itemsContainer || !emptyState || !subtotalEl) {
      return
    }

    if (cart.items.length === 0) {
      emptyState.classList.remove("tw:hidden")
      emptyState.hidden = false
      itemsContainer.innerHTML = ""
      itemsContainer.classList.add("tw:hidden")
      itemsContainer.hidden = true
    } else if (lineTemplate && lineTemplate.content) {
      emptyState.classList.add("tw:hidden")
      emptyState.hidden = true
      itemsContainer.classList.remove("tw:hidden")
      itemsContainer.hidden = false
      var fragment = document.createDocumentFragment()
      for (var i = 0; i < cart.items.length && i < 10; i += 1) {
        var item = cart.items[i]
        var clone = lineTemplate.content.cloneNode(true)
        var li = clone.firstElementChild
        if (!li) continue

        li.setAttribute("data-cart-line-key", item.key)

        var img = li.querySelector("[data-cart-line-image]")
        if (img) {
          if (item.image) {
            img.src = item.image
            img.alt = item.product_title || item.title || ""
            img.classList.remove("tw:hidden")
          } else {
            img.classList.add("tw:hidden")
          }
        }

        var titleEl = li.querySelector("[data-cart-line-title]")
        if (titleEl) titleEl.textContent = item.product_title || item.title || ""

        var variantEl = li.querySelector("[data-cart-line-variant]")
        if (variantEl) {
          if (item.variant_title && item.variant_title !== "Default Title") {
            variantEl.textContent = item.variant_title
            variantEl.hidden = false
          } else {
            variantEl.hidden = true
          }
        }

        var qtyEl = li.querySelector("[data-cart-line-qty]")
        if (qtyEl) qtyEl.textContent = String(item.quantity)

        var qtyVal = String(item.quantity)
        var minusBtn = li.querySelector('[data-cart-qty-change="decrement"]')
        var plusBtn = li.querySelector('[data-cart-qty-change="increment"]')
        if (minusBtn) {
          minusBtn.setAttribute("data-line-key", item.key)
          minusBtn.setAttribute("data-current-qty", qtyVal)
        }
        if (plusBtn) {
          plusBtn.setAttribute("data-line-key", item.key)
          plusBtn.setAttribute("data-current-qty", qtyVal)
        }

        var hasSale =
          typeof item.original_line_price === "number" &&
          typeof item.final_line_price === "number" &&
          item.original_line_price > item.final_line_price

        var priceEl = li.querySelector("[data-cart-line-price]")
        if (priceEl) {
          var effective = hasSale ? item.final_line_price : item.line_price
          priceEl.textContent = formatter.format(effective / 100)
        }

        var originalEl = li.querySelector("[data-cart-line-original]")
        if (originalEl) {
          if (hasSale) {
            originalEl.textContent = formatter.format(item.original_line_price / 100)
            originalEl.classList.remove("tw:hidden")
          } else {
            originalEl.classList.add("tw:hidden")
          }
        }

        fragment.appendChild(li)
      }
      itemsContainer.innerHTML = ""
      itemsContainer.appendChild(fragment)
    } else {
      emptyState.classList.add("tw:hidden")
      emptyState.hidden = true
      itemsContainer.classList.remove("tw:hidden")
      itemsContainer.hidden = false
      itemsContainer.innerHTML = ""
    }

    subtotalEl.textContent = formatter.format(cart.total_price / 100)
  }

  function handleProductFormSubmit(event) {
    var form = event.target
    if (form && form.nodeName !== "FORM" && form.closest) {
      form = form.closest("form")
    }

    if (!form || !form.matches || !form.matches('form[action*="/cart/add"]')) {
      return
    }

    if (!window.fetch || !window.FormData) {
      return
    }

    event.preventDefault()

    var submitter = event.submitter
    if (submitter && submitter.nodeName === "BUTTON") {
      submitter.setAttribute("data-cart-add-busy", "true")
      submitter.disabled = true
      var addSpinner = document.createElement("span")
      addSpinner.setAttribute("data-cart-add-spinner", "")
      addSpinner.className =
        "tw:hidden tw:ml-2 tw:inline-flex tw:w-4 tw:h-4 tw:rounded-full tw:border-2 tw:border-current tw:border-t-transparent tw:animate-spin"
      addSpinner.setAttribute("aria-hidden", "true")
      submitter.appendChild(addSpinner)
    }

    var formData = new FormData(form)

    function clearAddBusy() {
      if (submitter && submitter.nodeName === "BUTTON") {
        submitter.removeAttribute("data-cart-add-busy")
        submitter.disabled = false
        var s = submitter.querySelector("[data-cart-add-spinner]")
        if (s) s.remove()
      }
    }

    fetch("/cart/add.js", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
      credentials: "same-origin"
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Add to cart failed")
        }
        return response.json()
      })
      .then(function () {
        return fetch("/cart.js", { credentials: "same-origin" })
      })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Cart request failed")
        }
        return response.json()
      })
      .then(function (cart) {
        openDrawer(cart)
        clearAddBusy()
      })
      .catch(function () {
        clearAddBusy()
        closeDrawer()
        window.location.href = "/cart"
      })
  }

  function handleClick(event) {
    var target = event.target

    var trigger = target.closest && target.closest("[data-cart-drawer-trigger]")
    if (trigger) {
      event.preventDefault()
      openDrawer()
      return
    }

    if (target.closest && target.closest("[data-cart-drawer-close]")) {
      event.preventDefault()
      closeDrawer()
      return
    }

    if (overlay && target === overlay) {
      event.preventDefault()
      closeDrawer()
      return
    }

    var qtyTrigger = target.closest ? target.closest("[data-cart-qty-change]") : null
    if (qtyTrigger) {
      event.preventDefault()
      var key = qtyTrigger.getAttribute("data-line-key")
      var direction = qtyTrigger.getAttribute("data-cart-qty-change")
      var currentQty = parseInt(qtyTrigger.getAttribute("data-current-qty") || "0", 10)
      if (!key || !direction || !currentQty || currentQty < 0) {
        return
      }
      var nextQty = direction === "increment" ? currentQty + 1 : currentQty - 1
      if (nextQty < 0) {
        nextQty = 0
      }

      var lineEl = itemsContainer.querySelector('[data-cart-line-key="' + key + '"]')
      if (lineEl) lineEl.setAttribute("data-loading", "true")

      fetch("/cart/change.js", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        credentials: "same-origin",
        body: JSON.stringify({ id: key, quantity: nextQty })
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error("Quantity change failed")
          }
          return response.json()
        })
        .then(function (cart) {
          updateDrawer(cart)
        })
        .catch(function () {
          if (lineEl) lineEl.removeAttribute("data-loading")
          window.location.href = "/cart"
        })
    }
  }

  document.addEventListener("submit", handleProductFormSubmit, true)
  document.addEventListener("click", handleClick)

  if (closeButtons && closeButtons.length > 0) {
    Array.prototype.forEach.call(closeButtons, function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault()
        closeDrawer()
      })
    })
  }
}

