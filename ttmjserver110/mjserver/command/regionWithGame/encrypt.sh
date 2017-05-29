if [ ! $# == 1  ];then
    echo " not found dir"
    exit
fi

source ~/.bash_profile

RES_DIR=$1

# mp3 暂时不加密 MP3文件的解析是ios静态库做的
types=".png .json"

for type in $types
do
    echo "type ........ $type"
    find $RES_DIR -type f -name "*$type" | while read file
    do
        echo $file
        # 加密必须用decrypt_basic 不能使用默认0
        ./BTEncrypt  1  $file 1
    done
done
