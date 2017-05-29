#!/bin/bash

filename=${0}
extension="${filename##*.}"
currentFileName="${filename%.*}"

bash baseScript ${currentFileName}