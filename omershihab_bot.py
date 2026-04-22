import os
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import yt_dlp
import asyncio

# بيانات البوت
TOKEN = '8266072398:AAHO8y2Vd-i-3h9MQbx_i2ui2mMl6X9RRcY'
GROUP_LINK = "https://t.me/FalconsofIraq"

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # الرسالة الترحيبية عند تشغيل البوت
    welcome_text = (
        "اهلا وسهلا بكم بوت صقور العراق لتحميل الفيديوهات\n"
        "أمن ✅\n"
        "سريع ✅\n"
        "بدون اعلانات ✅\n\n"
        "فقط انسخ كود الفيديو والسقه هنا . مجموعتنا على تلكرام حياكم الله " + GROUP_LINK
    )
    await update.message.reply_text(welcome_text)

async def download_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    url = update.message.text
    chat_id = update.message.chat_id

    if 'shorts/' in url:
        url = url.replace('shorts/', 'watch?v=')

    status_msg = await update.message.reply_text("الصقور تحملك الفيديو انتظر يابطل 🦅🔥")

    ydl_opts = {
        'format': 'best',
        'outtmpl': f'video_{chat_id}.%(ext)s',
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'nocheckcertificate': True,
        'geo_bypass': True,
        'add_header': {'Accept-Language': 'en-US,en;q=0.9', 'Referer': 'https://www.google.com/'}
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = await asyncio.to_thread(ydl.extract_info, url, download=True)
            filename = ydl.prepare_filename(info)

        with open(filename, 'rb') as video:
            # التعديل هنا: تم حذف جملة "تم التحميل بواسطة" وإبقاء الرابط فقط
            await context.bot.send_video(
                chat_id=chat_id,
                video=video,
                caption=f"{GROUP_LINK}",
                supports_streaming=True
            )

        if os.path.exists(filename):
            os.remove(filename)
        await status_msg.delete()

    except Exception as e:
        print(f"Error: {e}")
        # رسالة تظهر في حال وجود مشكلة في الرابط أو الاتصال
        await status_msg.edit_text("⚠️ حدث خطأ أو الرابط غير مدعوم.\nتأكد من جودة الإنترنت.")
        for file in os.listdir():
            if file.startswith(f'video_{chat_id}'):
                os.remove(file)

def main():
    # إعدادات لضمان استقرار الاتصال في Termux
    application = (
        Application.builder()
        .token(TOKEN)
        .connect_timeout(40)
        .read_timeout(40)
        .write_timeout(40)
        .build()
    )

    application.add_handler(CommandHandler("start", start))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, download_video))

    print("البوت يعمل الآن.. تم تحديث الكابشن وإبقاء الرابط فقط.")
    application.run_polling(drop_pending_updates=True)

if __name__ == '__main__':
    main()
