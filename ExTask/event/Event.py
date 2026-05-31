from gameData import clear_screen, pause_for_int, text

class Event():
    def __init__(self, title, content, options): # results): #생성자
        self.__title = title
        self.__options = options #선택지 리스트
        self.__content = content #내용
       #self.__results= results #선택지에 따른 결과 리스트

    #getter
    @property
    def title(self):
        return self.__title
    
    @property
    def content(self):
        return self.__content
    
    @property
    def options(self):
        return self.__options
    
    # @property
    # def result(self):
    #     return self.__results
    
    def optionLen(self):
        return len(self.options)+1
    
    #출력
    def occurEvent(self):
        while True:
            clear_screen()
            print(self.title+'\n')
            print(self.content+'\n')

            if self.options:
                for count, op in enumerate(self.options, start=1):
                    print(count, ": " + op)
                print(text("common", "eventEnterNumber"))
                select = pause_for_int(text("event", "inputPrompt"))
                if 1 <= select < self.optionLen():
                    return select
                print(text("common", "invalidNumber"))
            else:
                input(text("common", "continue"))
                return None
