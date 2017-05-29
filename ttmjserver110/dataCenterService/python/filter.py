
#过滤去重 uid, ip
#python test.py /root/dataCenterService/csv/phz /root/csv/phz

import os
import sys

src_path = sys.argv[1]
des_path = sys.argv[2]
os.system('mkdir -p %s' % des_path)
list_file = os.listdir(src_path)
for i in list_file:
    out_dict = {}
    src_file = src_path + '/' + i
    des_file = des_path + '/' + i
    with open(src_file, 'r') as src:
        a = src.readlines()
        for line in a:
            b = line.split(',')
            if len(b) == 2:
                out_dict[b[0]] = b[1]
    with open(des_file, 'w') as des:
        for key in out_dict.keys():
            des.write('%s,%s' % (key, out_dict[key]))
