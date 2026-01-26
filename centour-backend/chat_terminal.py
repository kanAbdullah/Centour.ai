import os
from openai import OpenAI
from dotenv import load_dotenv
from google import genai
load_dotenv()


api_key = os.getenv("GEMINI_API_KEY")
#deepseek = OpenAI(api_key=api_key, base_url="https://api.deepseek.com")


client = genai.Client(api_key=api_key)

chat = client.chats.create(model="gemini-2.5-flash")


def main():
    print("LLM Terminal Chat (Type ''exit'' to quit)")

    messages = [{"role":"system","content":"Sen akademik bir çalışma yardımcısısın. Açık, detaylı ve görsel destekli cevaplar ver."}]

    while True:
        user_input = input("👤 Sen: ")
        if (user_input.lower() in ["exit","quit"]):
            break
            


        try:
            response = chat.send_message(user_input)
            print(response.text)

        except Exception as e:
            print("Womp womp:",str(e))

if __name__ == "__main__":
    main()
