#!/usr/bin/python
#coding=utf8

import os,stat,tarfile
import socket
import smtplib
import sys
import subprocess
import shutil
from email.mime.text import MIMEText
script_path=os.path.dirname(sys.argv[0])
if script_path=='.':
  script_path=os.getcwd()
sys.path.append(script_path)
mail_host='mail.bbctop.com'
mail_user=''
mail_pass=''
mail_postfix='bbctop.com'
to_email=['logsend@bbctop.com']
mail_from='BBCTOP'+'<'+mail_user+'@'+mail_postfix+'>'
hname=socket.gethostname()
class Mail(object):
  def __init__(self,mzhuti,mnr):
    self.mzhuti=mzhuti
    self.mnr=mnr
  def send(self):
    email_user=mail_user+'@'+mail_postfix
    msg = MIMEText(self.mnr,_subtype='plain',_charset='utf-8')
    msg['From'] = mail_from
    if not isinstance(self.mzhuti,unicode):
      self.mzhuti = unicode(self.mzhuti,'utf-8')
    msg['Subject'] = self.mzhuti
    msg['To'] = ';'.join(to_email)
    msg['BCC'] = 'ydx@bbctop.com'
#    bcc_mail2='hellonickyang@163.com'
#    bcc_mail='2880689519@qq.com'
    try:
      server = smtplib.SMTP()
#      server.connect(mail_host, 587)
      server.connect(mail_host, 25)
#-----------下面的starttls命令用于ssl发送----------
#      server.starttls()
      server.login(email_user, mail_pass)
#      server.sendmail(mail_from, [to_email,bcc_mail,bcc_mail2], msg.as_string())
      server.sendmail(mail_from, to_email, msg.as_string())
      server.close()
    except Exception, e:
      print str(e)
      quit()
if __name__=="__main__":
  mail=Mail()

class Tar_file(object):
  """tar file and untar file\n"""
  def __init__(self, target_gzfile='/data/upwww/default.tar.gz', fp='/data/1/'):
    self.target_gzfile=target_gzfile
    self.fp=fp
    self.base_path='/home/yangdongxu/shell/bak/'
  def addtar(self, target_gzfile, fp):
    self.target_gzfile=target_gzfile.split('/')[-1]
    self.fp=fp
    t=tarfile.open(self.base_path+self.target_gzfile,'w:gz')
    if os.path.isdir(self.fp):
      os.chdir(self.fp)
      for root,dir,files in os.walk(self.fp):
        for file in files:
          fullfp=os.path.join(root,file)
          fullfp=fullfp.replace(self.fp+os.sep, './')
	  os.chdir(self.fp)
	  t.add(fullfp, arcname=fullfp)
        if len(files)==0:
          fullfp=root
          fullfp=fullfp.replace(self.fp+os.sep, './')
          t.add(fullfp, arcname=fullfp)
    else:
      if os.path.isfile(self.fp):
        fullfp=self.fp.split('/')[-1]
        dirpath=os.path.dirname(self.fp)
        os.chdir(dirpath)
        tar_cmd = 'tar zcf {0} {1}'.format(self.target_gzfile, fullfp)
        os.system(tar_cmd)
        fullfp=self.fp.split('/')[-1]
        dirpath=os.path.dirname(self.fp)
        os.chdir(dirpath)
        t.add(fullfp, arcname=fullfp)
    t.close()
  def untar(self,target_gzfile, fpath):
    self.target_gzfile=target_gzfile
    self.fpath=fpath
    t=tarfile.open(self.target_gzfile, "r:gz")
    t.extractall(path=self.fpath)
    t.close()
if __name__=="__main__":
  tar=Tar_file()

class chown_fp(object):
  """change chown permission:
chownfp(username)\n"""
  def __init__(self, path='/data/upwww', username='www'):
    self.username=username
    self.path=path
  def cown_fp(self, vpath, vusername):
    self.username=vusername
    self.path=vpath
    suid=int(os.popen('id -u %s' % (self.username)).read().strip())
    sgid=int(os.popen('id -g %s' % (self.username)).read().strip())
    if os.path.isdir(self.path)==True:
      for root,dir,files in os.walk(self.path):
        for file in files:
          os.chown(root+os.sep+file, suid, sgid)
        os.chown(root, suid, sgid)
    else:
      if os.path.isfile(self.path)==True:
        os.chown(self.path, suid, sgid)

if __name__=="__main__":
  cown=chown_fp()

class mkfp(object):
  """create catalog and file:
mkf(file): create file
mkp(catalog): create catalog \n"""
  def __init__(self, fp='/data/upwww'):
    self.fp=fp
  def mkf(self, nfp):
    self.fp=nfp
    tup=os.path.split(self.fp)
    npath=tup[0]
    nfile=tup[1]
    if not os.path.exists(npath):
      os.makedirs(npath)
    if not os.path.exists(self.fp):
      os.mknod(self.fp)
  def mkp(self, nfp):
    self.fp=nfp
    if not os.path.exists(self.fp):
      os.makedirs(self.fp)
if __name__=="__main__":
  mk=mkfp()
#  print mk.__doc__

class chmod_fp(object):
  """change chmod file permission:
cmodfp(path, 755/777/644/600)\n"""
  def __init__(self, fp='/data/upwww', cmod=755):
    self.cmod=cmod
    self.fp=fp
  def chmodfp(self, nfp, ncmod):
    self.fp=nfp
    self.cmod=ncmod
    def do(fp):
      if self.cmod==755:
        os.chmod(fp, stat.S_IRWXU+stat.S_IRGRP+stat.S_IXGRP+stat.S_IROTH+stat.S_IXOTH)
      elif self.cmod==777:
        os.chmod(fp, stat.S_IRWXU+stat.S_IRWXG+stat.S_IRWXO)
      elif self.cmod==644:
        os.chmod(fp, stat.S_IRUSR+stat.S_IWUSR+stat.S_IRGRP+stat.S_IROTH)
      elif self.cmod==600:
        os.chmod(fp, stat.S_IRUSR+stat.S_IWUSR)
    if os.path.isfile(self.fp) == True:
      do(self.fp)
    else:
      for root,dir,files in os.walk(self.fp):
        do(root)
        for file in files:
          do(root+os.sep+file)
if __name__=="__main__":
  cmod=chmod_fp()
#  print cmod.__doc__

class Ln(object):
  def __init__(self, s, t):
    self.s = s
    self.t = t
  def do(self):
    if os.path.exists(self.t):
      check_link=os.popen('file %s' % (self.t)).read().strip('\n')
      cl = check_link.split()[1]
      if cl != 'symbolic':
        shutil.move(self.t, self.t+'.bak')
        sp = subprocess.call('ln -s %s %s' % (self.s, self.t), shell=True)
        if sp == 0:
          print 'link %s to %s' % (self.s, self.t)
        else:
          print sp
    else:
      sp = subprocess.call('ln -s %s %s' % (self.s, self.t), shell=True)
      if sp == 0:
        print 'link %s to %s' % (self.s, self.t)
      else:
        print sp
if __name__=="__main__":
  link = Ln(s,t)
