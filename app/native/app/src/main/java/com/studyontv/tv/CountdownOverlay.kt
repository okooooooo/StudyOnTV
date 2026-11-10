package com.studyontv.tv

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.TextView

/**
 * Remaining-time badge shown in the top-right corner while the child is watching video.
 * Minutes only; blinks during the final minute.
 *
 * Display only: FLAG_NOT_FOCUSABLE | FLAG_NOT_TOUCHABLE, so it never consumes remote-control
 * keys or touches. Driven by GateService's one-second tick. Not used on the quiz screen, which
 * has its own top pill.
 *
 * The window is created once and afterwards only toggled in visibility. Tearing it down and
 * building it again on every show/hide transition shows up as a flicker on TV: the show/hide
 * decision itself jitters every second (our own activity briefly takes the foreground, see
 * GatePresentation.countdownVisible), and a rebuilt window also releases and re-acquires the
 * GPU surface. Hiding therefore only stops drawing; the window is really removed in destroy().
 */
class CountdownOverlay(private val context: Context) {
    private val manager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    private var view: TextView? = null
    private var attached = false
    /**
     * Logically hidden: the window is still attached, it just does not draw.
     * Kept apart from the final-minute blink so the two never overwrite each other.
     */
    private var hidden = false
    private var blinkOn = true
    private var lastUrgent: Boolean? = null
    private var lastText: String? = null
    var lastError: String = ""
        private set

    /**
     * 角标窗口是否还挂在 WindowManager 上。
     * 隐藏后必须仍然是 true：拆了再建就是电视上看到的闪烁（回归测试用）。
     */
    val isAttached: Boolean get() = attached

    private fun dp(v: Int) = (v * context.resources.displayMetrics.density).toInt()

    private fun chip(): TextView = view ?: TextView(context).apply {
        textSize = 15f
        setPadding(dp(14), dp(6), dp(14), dp(6))
        // Some launchers and players have a very bright background; a shadow keeps the text
        // readable on any frame.
        setShadowLayer(4f, 0f, 1f, Color.argb(200, 0, 0, 0))
        view = this
    }

    private fun paint(urgent: Boolean) {
        val chip = view ?: return
        // null means "never painted yet". Without that, the first call (urgent = false) would
        // return early and neither the text color nor the background would ever be applied,
        // leaving a default grey label with no backdrop that is unreadable on dark footage.
        if (lastUrgent == urgent) return
        lastUrgent = urgent
        chip.setTextColor(if (urgent) Color.rgb(255, 92, 92) else Color.WHITE)
        chip.background = GradientDrawable().apply {
            cornerRadius = dp(18).toFloat()
            setColor(if (urgent) Color.argb(180, 40, 0, 0) else Color.argb(150, 0, 0, 0))
        }
    }

    /**
     * Final visibility of the badge: hidden wins over the final-minute blink.
     * The blink only flips the drawing state of an already attached window, so it no longer
     * creates and destroys a surface.
     */
    private fun applyVisibility(urgent: Boolean) {
        val chip = view ?: return
        if (hidden) { chip.visibility = View.INVISIBLE; return }
        if (urgent) {
            blinkOn = !blinkOn
            chip.visibility = if (blinkOn) View.VISIBLE else View.INVISIBLE
        } else {
            chip.visibility = View.VISIBLE
        }
    }

    /** [seconds]: total remaining seconds (quiz credit + daily free quota). Hidden when <= 0. */
    fun update(seconds: Long) {
        if (seconds <= 0) { hide(); return }
        val urgent = seconds <= 60
        val chip = chip()
        // Skip setText when the minute value has not changed: re-assigning the same text every
        // second still triggers a layout pass, which shows up as visible jitter on low-end TVs.
        val label = "剩余 ${(seconds + 59) / 60} 分钟"
        if (label != lastText) { chip.text = label; lastText = label }
        paint(urgent)
        hidden = false
        if (!attached) {
            val params = WindowManager.LayoutParams(
                WindowManager.LayoutParams.WRAP_CONTENT, WindowManager.LayoutParams.WRAP_CONTENT,
                GateOverlay.applicationWindowType(),
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN, PixelFormat.TRANSLUCENT)
            params.gravity = Gravity.TOP or Gravity.END
            params.x = dp(20); params.y = dp(12)
            params.title = "StudyOnTV countdown"
            try {
                manager.addView(chip, params)
                attached = true
                lastError = ""
            } catch (e: Exception) {
                lastError = e.javaClass.simpleName + ": " + (e.message ?: "")
                return
            }
        }
        applyVisibility(urgent)
    }

    /**
     * Hide the badge without tearing the window down.
     *
     * removeViewImmediate + addView on every transition is what made the badge flash on TV.
     * Only the pixels are suppressed here; the window stays attached and keeps its surface.
     */
    fun hide() {
        hidden = true
        view?.visibility = View.INVISIBLE
    }

    /** Really remove the window: only called when the service is torn down. */
    fun destroy() {
        detach()
        view = null
        lastText = null
        lastUrgent = null
        hidden = false
    }

    private fun detach() {
        val chip = view ?: return
        if (attached) try { manager.removeViewImmediate(chip) } catch (_: Exception) { }
        attached = false
    }
}
