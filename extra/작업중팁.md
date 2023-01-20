# 여기는 작업하다 귀찮았던거 적어 놓자

## 변환

### 한줄짜리 Text 만들어 놓은거 정규식 변환

* 입력:

```regex
(info|alert|alarm)Text\: '(.{1,100})',
```

* 출력:

```regex
$1Text: (_data,_matches, output) => output.text!(),\n      outputStrings: {\n        'text': {\n          en: '$2',\n          ja: '',\n        },\n      },
```

### OutputStrings 안에 한줄짜리 변환

* 입력 예시:

```regex
kbFront: '넉백! ${player} 앞에 서주세요',
```

* 출력:

```regex
$1: {\n          en: '$2',\n          ja: '$2',\n        },
```

### 폼 데이터 일괄 변환

```C#
Text = "\{(\d{4})\}";
Text = "\{(\d{1,4})\}";
Text = Du.Globalization.Locale.Text($1);
```

---

여까지
