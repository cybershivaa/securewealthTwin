import android.view.WindowManager
import java.util.function.Consumer

fun test(wm: WindowManager) {
    wm.addScreenRecordingCallback(Runnable::run, Consumer { state -> })
}
