#ADT 클래스 정의

from abc import ABC, abstractmethod

class PersonADT(ABC):
    @property
    @abstractmethod
    def name(self): #이름
        pass

    @property
    @abstractmethod
    def maxHealth(self): #최대체력
        pass

    @property
    @abstractmethod
    def stress(self): #스트레스
        pass

    @property
    @abstractmethod
    def intelligence(self): #지능
        pass

   #기본 정보 출력
    @abstractmethod
    def showStatus(self):
        pass

    #기본 변화 증감 연산
    @abstractmethod
    def changeMaxHealth(self, varMH): #체력 변화
        pass

    @abstractmethod
    def changeStress(self, varS): #스트레스 변화
        pass
    
    @abstractmethod
    def changeIntelligence(self, varI): #지능 변화
        pass
