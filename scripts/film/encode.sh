#!/bin/bash
# Joins the photo opening and the three filmed app scenes into assets/v6-film.{mp4,webm} and its poster.
#   scripts/film/encode.sh <photoFrames> <capDir>
# <photoFrames>: output of render.js on scene.html (the first 2.4 s are used); <capDir>: output of capture.js
set -e
P=$1; C=$2; X=0.4; out=assets/v6-film
# clip lengths in seconds: photo 2.4, platter 4.5 (skips the empty board), ditto 8.5, freq 5.2, photo again 0.5 to close the loop
in=(-framerate 30 -t 2.4 -i "$P/f%04d.jpg" -framerate 30 -start_number 27 -i "$C/platter/f%04d.jpg" -framerate 30 -start_number 9 -i "$C/ditto/f%04d.jpg"
    -framerate 30 -i "$C/freq/f%04d.jpg" -loop 1 -framerate 30 -t 0.5 -i "$P/f0000.jpg")
fc="[0][1]xfade=transition=fade:duration=$X:offset=2.0[a];[a][2]xfade=transition=fade:duration=$X:offset=6.1[b];[b][3]xfade=transition=fade:duration=$X:offset=14.2[c];[c][4]xfade=transition=fade:duration=$X:offset=19.0,format=yuv420p[v]"
ffmpeg -loglevel error -y "${in[@]}" -filter_complex "$fc" -map "[v]" -c:v libx264 -preset slow -crf 25 -movflags +faststart -an $out.mp4
ffmpeg -loglevel error -y "${in[@]}" -filter_complex "$fc" -map "[v]" -c:v libvpx-vp9 -b:v 0 -crf 38 -row-mt 1 -an $out.webm
ffmpeg -loglevel error -y -ss 5.2 -i $out.mp4 -frames:v 1 -quality 82 $out-poster.webp
