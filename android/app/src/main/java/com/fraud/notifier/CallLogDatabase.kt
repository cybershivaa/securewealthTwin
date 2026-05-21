package com.fraud.notifier

import androidx.room.*
import android.content.Context

@Entity(tableName = "call_logs")
data class CallLog(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val number: String,
    val transcript: String,
    val result: String,
    val timestamp: Long = System.currentTimeMillis()
)

@Dao
interface CallLogDao {
    @Insert
    fun insert(log: CallLog)

    @Query("SELECT * FROM call_logs ORDER BY timestamp DESC")
    fun getAll(): List<CallLog>
}

@Database(entities = [CallLog::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun callLogDao(): CallLogDao

    companion object {
        @Volatile private var instance: AppDatabase? = null
        fun getDatabase(context: Context): AppDatabase =
            instance ?: synchronized(this) {
                instance ?: Room.databaseBuilder(context, AppDatabase::class.java, "fraud_db")
                    .build().also { instance = it }
            }
    }
}
