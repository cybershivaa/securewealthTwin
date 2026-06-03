import android.view.WindowManager
import java.util.function.Consumer
import java.util.concurrent.Executor

fun check(wm: WindowManager) {
    wm.addScreenRecordingCallback(Executor { it.run() }, Consumer { state -> })
}
