const setCookie = (name, value, days = 7, path = '/') => {
	const expires = new Date(Date.now() + days * 864e5).toUTCString();
	document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=' + path;
}

const getCookie = (name) => {
	return document.cookie.split('; ').reduce((r, v) => {
		const parts = v.split('=')
		return parts[0] === name ? decodeURIComponent(parts[1]) : r
	}, '');
}

const deleteCookie = (name, path) => {
	setCookie(name, '', -1, path);
}

// function throttleAsync (fn, wait) {
// 	let lastRun = 0, maxCount = 2;

// 	async function throttled(...args) {
// 		const currentWait = lastRun + wait - Date.now();
// 		const shouldRun = currentWait <= 0;

// 		if (shouldRun) {
// 			lastRun = Date.now();
// 			return await fn(...args);
// 		} else {
// 			return await new Promise(function(resolve) {
// 				setTimeout(function() {
// 					resolve(throttled());
// 				}, currentWait);
// 			});
// 		}
// 	}

// 	return throttled;
// }

function isObject(value) {
	const type = typeof value
	return value != null && (type === 'object' || type === 'function')
}

// https://github.com/lodash/lodash/blob/master/debounce.js
function debounce(func, wait, options) {
	let lastArgs,
		lastThis,
		maxWait,
		result,
		timerId,
		lastCallTime

	let lastInvokeTime = 0
	let leading = false
	let maxing = false
	let trailing = true

	// Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
	const useRAF = (!wait && wait !== 0 && typeof window.requestAnimationFrame === 'function')

	if (typeof func !== 'function') {
		throw new TypeError('Expected a function')
	}
	wait = +wait || 0
	if (isObject(options)) {
		leading = !!options.leading
		maxing = 'maxWait' in options
		maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
		trailing = 'trailing' in options ? !!options.trailing : trailing
	}

	function invokeFunc(time) {
		const args = lastArgs
		const thisArg = lastThis

		lastArgs = lastThis = undefined
		lastInvokeTime = time
		result = func.apply(thisArg, args)
		return result
	}

	function startTimer(pendingFunc, wait) {
		if (useRAF) {
			window.cancelAnimationFrame(timerId)
			return window.requestAnimationFrame(pendingFunc)
		}
		return setTimeout(pendingFunc, wait)
	}

	function cancelTimer(id) {
		if (useRAF) {
			return window.cancelAnimationFrame(id)
		}
		clearTimeout(id)
	}

	function leadingEdge(time) {
		// Reset any `maxWait` timer.
		lastInvokeTime = time
		// Start the timer for the trailing edge.
		timerId = startTimer(timerExpired, wait)
		// Invoke the leading edge.
		return leading ? invokeFunc(time) : result
	}

	function remainingWait(time) {
		const timeSinceLastCall = time - lastCallTime
		const timeSinceLastInvoke = time - lastInvokeTime
		const timeWaiting = wait - timeSinceLastCall

		return maxing
			? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
			: timeWaiting
	}

	function shouldInvoke(time) {
		const timeSinceLastCall = time - lastCallTime
		const timeSinceLastInvoke = time - lastInvokeTime

		// Either this is the first call, activity has stopped and we're at the
		// trailing edge, the system time has gone backwards and we're treating
		// it as the trailing edge, or we've hit the `maxWait` limit.
		return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
			(timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
	}

	function timerExpired() {
		const time = Date.now()
		if (shouldInvoke(time)) {
			return trailingEdge(time)
		}
		// Restart the timer.
		timerId = startTimer(timerExpired, remainingWait(time))
	}

	function trailingEdge(time) {
		timerId = undefined

		// Only invoke if we have `lastArgs` which means `func` has been
		// debounced at least once.
		if (trailing && lastArgs) {
			return invokeFunc(time)
		}
		lastArgs = lastThis = undefined
		return result
	}

	function cancel() {
		if (timerId !== undefined) {
			cancelTimer(timerId)
		}
		lastInvokeTime = 0
		lastArgs = lastCallTime = lastThis = timerId = undefined
	}

	function flush() {
		return timerId === undefined ? result : trailingEdge(Date.now())
	}

	function pending() {
		return timerId !== undefined
	}

	function debounced(...args) {
		const time = Date.now()
		const isInvoking = shouldInvoke(time)

		lastArgs = args
		lastThis = this
		lastCallTime = time

		if (isInvoking) {
			if (timerId === undefined) {
				return leadingEdge(lastCallTime)
			}
			if (maxing) {
				// Handle invocations in a tight loop.
				timerId = startTimer(timerExpired, wait)
				return invokeFunc(lastCallTime)
			}
		}
		if (timerId === undefined) {
			timerId = startTimer(timerExpired, wait)
		}
		return result
	}
	debounced.cancel = cancel
	debounced.flush = flush
	debounced.pending = pending
	return debounced
}