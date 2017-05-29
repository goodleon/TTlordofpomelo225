#!/usr/bin/python
# -*- coding: UTF-8 -*-

"""
排序充值记录
uid,buyNum,buyMoney,buyNote,buyType,byMid,byName,adminLevel,money,userMoney,buyTime
101010,30,30,"","1",589021,"陈俊",0,1677,30,2016-12-06T16:01:54.346Z
"""

import os
import sys
import time

ticks = time.time()#耗时
src_path = sys.argv[1]
des_path = sys.argv[2]
os.system('mkdir -p %s' % des_path)

list_file = os.listdir(src_path)
list_file_len = len(list_file)
list_file_idx = 0

#过滤特殊符号
def isNumberString(eLogStr):
	#print 'isNumberString = ',eLogStr, type(eLogStr)
	if eLogStr == '' or eLogStr == '\n' or 'e' in eLogStr or '"' in eLogStr:
		return False;
	else:
		return True;
		
for i in list_file:
	list_file_idx = list_file_idx + 1
	print "%d/%d: %s"%(list_file_idx,list_file_len, i)
	out_dict = {}
	src_file = src_path + '/' + i
	des_file = des_path + '/' + i
	fIndex = 0
	money = 0L;#钱1
	money2 = 0L;#钱2
	with open(src_file, 'r') as src:
		a = src.readlines()
		for line in a:
			b = line.split(',')
			if(len(b) < 2):
				break
			uid = b[0]
			fIndex = fIndex + 1
			#print 'fIndex = ', fIndex
			#if uid == 'uid':
			#	continue;
				
			if uid in out_dict:
				
				#print 'EEEEE = %s, %s'%(b[index], type(b[index]))
				if isNumberString(b[2]):
					tmpMoney = long(round(float(b[2])))
					out_dict[uid][2] += tmpMoney
					money += tmpMoney;
					#print 'buyMoney = ', out_dict[uid][2]
			else:		
				out_dict[b[0]] = {};
				for index in range(len(b)):
					#print ' type ', type(b[index]), b[index]
					if uid != 'uid' and uid != 'mid' and index == 2 :
						if isNumberString(b[index]):
							out_dict[uid][index] = long(round(float(b[index])));
						else:
							out_dict[uid][index] = 0;
						money += out_dict[uid][index];
					else:
						out_dict[uid][index] = b[index];
				
		#print 'before = ', out_dict	
		#按money排序
		out_dict = sorted(out_dict.iteritems(), key=lambda d:d[1][2], reverse = True)
		#print 'after = ', out_dict
		
		with open(des_file, 'w') as des:
			out_dict_len = len(out_dict)
			for idx in range(out_dict_len):
				dic = out_dict[idx][1];
				dicLen = len(dic)
				dicIndex = 0;
				#print 'dic = ', type(dicLen), type(dicIndex)
				tmpStr = ''
				#print 'dic = ', dic
				for key in dic.keys():
					#print 'type = ', type(dic[key])
					if(isinstance(dic[key],(long,int))):
						money2 += long(dic[key]);
						tmpStr += str(dic[key])
					else:
						tmpStr += dic[key]
					
					dicIndex = dicIndex + 1
					if(dicLen > (dicIndex + 1)):
						tmpStr += ','
						#print 'tmpStr = ', dicLen, dicIndex+1, (dicLen != (dicIndex + 1)), tmpStr
				des.write(tmpStr)
				#des.write('%s,%s' % (key, out_dict[key]))
	print 'money, money2:', money, money2
print '耗时:', time.time() - ticks
			
