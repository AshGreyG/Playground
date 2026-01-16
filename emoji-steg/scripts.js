class EmojiSteganography {
  // This regex comes from npm package emoji-regex
  static EMOJI_REGEX = /[#*0-9]\uFE0F?\u20E3|[\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23ED-\u23EF\u23F1\u23F2\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB\u25FC\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692\u2694-\u2697\u2699\u269B\u269C\u26A0\u26A7\u26AA\u26B0\u26B1\u26BD\u26BE\u26C4\u26C8\u26CF\u26D1\u26E9\u26F0-\u26F5\u26F7\u26F8\u26FA\u2702\u2708\u2709\u270F\u2712\u2714\u2716\u271D\u2721\u2733\u2734\u2744\u2747\u2757\u2763\u27A1\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B55\u3030\u303D\u3297\u3299]\uFE0F?|[\u261D\u270C\u270D](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\u270A\u270B](?:\uD83C[\uDFFB-\uDFFF])?|[\u23E9-\u23EC\u23F0\u23F3\u25FD\u2693\u26A1\u26AB\u26C5\u26CE\u26D4\u26EA\u26FD\u2705\u2728\u274C\u274E\u2753-\u2755\u2795-\u2797\u27B0\u27BF\u2B50]|\u26D3\uFE0F?(?:\u200D\uD83D\uDCA5)?|\u26F9(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\u2764\uFE0F?(?:\u200D(?:\uD83D\uDD25|\uD83E\uDE79))?|\uD83C(?:[\uDC04\uDD70\uDD71\uDD7E\uDD7F\uDE02\uDE37\uDF21\uDF24-\uDF2C\uDF36\uDF7D\uDF96\uDF97\uDF99-\uDF9B\uDF9E\uDF9F\uDFCD\uDFCE\uDFD4-\uDFDF\uDFF5\uDFF7]\uFE0F?|[\uDF85\uDFC2\uDFC7](?:\uD83C[\uDFFB-\uDFFF])?|[\uDFC4\uDFCA](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDFCB\uDFCC](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDCCF\uDD8E\uDD91-\uDD9A\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF43\uDF45-\uDF4A\uDF4C-\uDF7C\uDF7E-\uDF84\uDF86-\uDF93\uDFA0-\uDFC1\uDFC5\uDFC6\uDFC8\uDFC9\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF8-\uDFFF]|\uDDE6\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF]|\uDDE7\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF]|\uDDE8\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF7\uDDFA-\uDDFF]|\uDDE9\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF]|\uDDEA\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA]|\uDDEB\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7]|\uDDEC\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE]|\uDDED\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA]|\uDDEE\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9]|\uDDEF\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5]|\uDDF0\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF]|\uDDF1\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE]|\uDDF2\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF]|\uDDF3\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF]|\uDDF4\uD83C\uDDF2|\uDDF5\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE]|\uDDF6\uD83C\uDDE6|\uDDF7\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC]|\uDDF8\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF]|\uDDF9\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF]|\uDDFA\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF]|\uDDFB\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA]|\uDDFC\uD83C[\uDDEB\uDDF8]|\uDDFD\uD83C\uDDF0|\uDDFE\uD83C[\uDDEA\uDDF9]|\uDDFF\uD83C[\uDDE6\uDDF2\uDDFC]|\uDF44(?:\u200D\uD83D\uDFEB)?|\uDF4B(?:\u200D\uD83D\uDFE9)?|\uDFC3(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDFF3\uFE0F?(?:\u200D(?:\u26A7\uFE0F?|\uD83C\uDF08))?|\uDFF4(?:\u200D\u2620\uFE0F?|\uDB40\uDC67\uDB40\uDC62\uDB40(?:\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDC73\uDB40\uDC63\uDB40\uDC74|\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F)?)|\uD83D(?:[\uDC3F\uDCFD\uDD49\uDD4A\uDD6F\uDD70\uDD73\uDD76-\uDD79\uDD87\uDD8A-\uDD8D\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA\uDECB\uDECD-\uDECF\uDEE0-\uDEE5\uDEE9\uDEF0\uDEF3]\uFE0F?|[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDC8F\uDC91\uDCAA\uDD7A\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC](?:\uD83C[\uDFFB-\uDFFF])?|[\uDC6E-\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4\uDEB5](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD74\uDD90](?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?|[\uDC00-\uDC07\uDC09-\uDC14\uDC16-\uDC25\uDC27-\uDC3A\uDC3C-\uDC3E\uDC40\uDC44\uDC45\uDC51-\uDC65\uDC6A\uDC79-\uDC7B\uDC7D-\uDC80\uDC84\uDC88-\uDC8E\uDC90\uDC92-\uDCA9\uDCAB-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDDA4\uDDFB-\uDE2D\uDE2F-\uDE34\uDE37-\uDE41\uDE43\uDE44\uDE48-\uDE4A\uDE80-\uDEA2\uDEA4-\uDEB3\uDEB7-\uDEBF\uDEC1-\uDEC5\uDED0-\uDED2\uDED5-\uDED8\uDEDC-\uDEDF\uDEEB\uDEEC\uDEF4-\uDEFC\uDFE0-\uDFEB\uDFF0]|\uDC08(?:\u200D\u2B1B)?|\uDC15(?:\u200D\uD83E\uDDBA)?|\uDC26(?:\u200D(?:\u2B1B|\uD83D\uDD25))?|\uDC3B(?:\u200D\u2744\uFE0F?)?|\uDC41\uFE0F?(?:\u200D\uD83D\uDDE8\uFE0F?)?|\uDC68(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDC68\uDC69]\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?)|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFC-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFD-\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFD\uDFFF]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?\uDC68\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDD1D\uDEEF]\u200D\uD83D\uDC68\uD83C[\uDFFB-\uDFFE]|[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3])))?))?|\uDC69(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:\uDC8B\u200D\uD83D)?[\uDC68\uDC69]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?|\uDC69\u200D\uD83D(?:\uDC66(?:\u200D\uD83D\uDC66)?|\uDC67(?:\u200D\uD83D[\uDC66\uDC67])?))|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFC-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFD-\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFD\uDFFF]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D\uD83D(?:[\uDC68\uDC69]|\uDC8B\u200D\uD83D[\uDC68\uDC69])\uD83C[\uDFFB-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3]|\uDD1D\u200D\uD83D[\uDC68\uDC69]\uD83C[\uDFFB-\uDFFE]|\uDEEF\u200D\uD83D\uDC69\uD83C[\uDFFB-\uDFFE])))?))?|\uDD75(?:\uD83C[\uDFFB-\uDFFF]|\uFE0F)?(?:\u200D[\u2640\u2642]\uFE0F?)?|\uDE2E(?:\u200D\uD83D\uDCA8)?|\uDE35(?:\u200D\uD83D\uDCAB)?|\uDE36(?:\u200D\uD83C\uDF2B\uFE0F?)?|\uDE42(?:\u200D[\u2194\u2195]\uFE0F?)?|\uDEB6(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?)|\uD83E(?:[\uDD0C\uDD0F\uDD18-\uDD1F\uDD30-\uDD34\uDD36\uDD77\uDDB5\uDDB6\uDDBB\uDDD2\uDDD3\uDDD5\uDEC3-\uDEC5\uDEF0\uDEF2-\uDEF8](?:\uD83C[\uDFFB-\uDFFF])?|[\uDD26\uDD35\uDD37-\uDD39\uDD3C-\uDD3E\uDDB8\uDDB9\uDDCD\uDDCF\uDDD4\uDDD6-\uDDDD](?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDDDE\uDDDF](?:\u200D[\u2640\u2642]\uFE0F?)?|[\uDD0D\uDD0E\uDD10-\uDD17\uDD20-\uDD25\uDD27-\uDD2F\uDD3A\uDD3F-\uDD45\uDD47-\uDD76\uDD78-\uDDB4\uDDB7\uDDBA\uDDBC-\uDDCC\uDDD0\uDDE0-\uDDFF\uDE70-\uDE7C\uDE80-\uDE8A\uDE8E-\uDEC2\uDEC6\uDEC8\uDECD-\uDEDC\uDEDF-\uDEEA\uDEEF]|\uDDCE(?:\uD83C[\uDFFB-\uDFFF])?(?:\u200D(?:[\u2640\u2642]\uFE0F?(?:\u200D\u27A1\uFE0F?)?|\u27A1\uFE0F?))?|\uDDD1(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1|\uDDD1\u200D\uD83E\uDDD2(?:\u200D\uD83E\uDDD2)?|\uDDD2(?:\u200D\uD83E\uDDD2)?))|\uD83C(?:\uDFFB(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFC-\uDFFF])))?|\uDFFC(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFD-\uDFFF])))?|\uDFFD(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])))?|\uDFFE(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFD\uDFFF])))?|\uDFFF(?:\u200D(?:[\u2695\u2696\u2708]\uFE0F?|\u2764\uFE0F?\u200D(?:\uD83D\uDC8B\u200D)?\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE]|\uD83C[\uDF3E\uDF73\uDF7C\uDF84\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D(?:[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uDC30\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])|\uD83E(?:[\uDDAF\uDDBC\uDDBD](?:\u200D\u27A1\uFE0F?)?|[\uDDB0-\uDDB3\uDE70]|\uDD1D\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFF]|\uDEEF\u200D\uD83E\uDDD1\uD83C[\uDFFB-\uDFFE])))?))?|\uDEF1(?:\uD83C(?:\uDFFB(?:\u200D\uD83E\uDEF2\uD83C[\uDFFC-\uDFFF])?|\uDFFC(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFD-\uDFFF])?|\uDFFD(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])?|\uDFFE(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFD\uDFFF])?|\uDFFF(?:\u200D\uD83E\uDEF2\uD83C[\uDFFB-\uDFFE])?))?)/g;
  static EMOJI_CONTROL = {
    step1Right: [
      "➡️", "▶️", "🔜", "👉", "👉🏻", "👉🏼", "👉🏽", "👉🏾", "👉🏿",
    ],
    step2Right: [
      "⏩", "⏭️",
    ],
    step1Left: [
      "⬅️", "◀️", "🔙", "👈", "👈🏻", "👈🏼", "👈🏽", "👈🏾", "👈🏿",
    ],
    step2Left: [
      "⏪", "⏮️",
    ],
    stepZigRight: [
      "🔁",
    ],
    stepZigLeft: [
      "🔄",
    ],
  };
  static EMOJI_NORMAL = ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","🫠","😉","😊","😇","🥰","😍","🤩","😘","😗","☺","😚","😙","🥲","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🫢","🫣","🤫","🤔","🫡","🤐","🤨","😐","😑","😶","🫥","😶‍🌫️","😏","😒","🙄","😬","😮‍💨","🤥","🫨","🙂‍↔️","🙂‍↕️","😌","😔","😪","🤤","😴","🫩","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","😵‍💫","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","🫤","😟","🙁","☹","😮","😯","😲","😳","🥺","🥹","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","☠","💩","🤡","👹","👺","👻","👽","👾","🤖","😺","😸","😹","😻","😼","😽","🙀","😿","😾","🙈","🙉","🙊","💌","💘","💝","💖","💗","💓","💞","💕","💟","❣","💔","❤️‍🔥","❤️‍🩹","❤","🩷","🧡","💛","💚","💙","🩵","💜","🤎","🖤","🩶","🤍","💋","💯","💢","💥","💫","💦","💨","🕳","💬","👁️‍🗨️","🗨","🗯","💭","💤","👋","🤚","🖐","✋","🖖","🫱","🫲","🫳","🫴","🫷","🫸","👌","🤌","🤏","✌","🤞","🫰","🤟","🤘","🤙","👆","🖕","👇","☝","🫵","👍","👎","✊","👊","🤛","🤜","👏","🙌","🫶","👐","🤲","🤝","🙏","✍","💅","🤳","💪","🦾","🦿","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁","👅","👄","🫦","👶","🧒","👦","👧","🧑","👱","👨","🧔","🧔‍♂️","🧔‍♀️","👨‍🦰","👨‍🦱","👨‍🦳","👨‍🦲","👩","👩‍🦰","🧑‍🦰","👩‍🦱","🧑‍🦱","👩‍🦳","🧑‍🦳","👩‍🦲","🧑‍🦲","👱‍♀️","👱‍♂️","🧓","👴","👵","🙍","🙍‍♂️","🙍‍♀️","🙎","🙎‍♂️","🙎‍♀️","🙅","🙅‍♂️","🙅‍♀️","🙆","🙆‍♂️","🙆‍♀️","💁","💁‍♂️","💁‍♀️","🙋","🙋‍♂️","🙋‍♀️","🧏","🧏‍♂️","🧏‍♀️","🙇","🙇‍♂️","🙇‍♀️","🤦","🤦‍♂️","🤦‍♀️","🤷","🤷‍♂️","🤷‍♀️","🧑‍⚕️","👨‍⚕️","👩‍⚕️","🧑‍🎓","👨‍🎓","👩‍🎓","🧑‍🏫","👨‍🏫","👩‍🏫","🧑‍⚖️","👨‍⚖️","👩‍⚖️","🧑‍🌾","👨‍🌾","👩‍🌾","🧑‍🍳","👨‍🍳","👩‍🍳","🧑‍🔧","👨‍🔧","👩‍🔧","🧑‍🏭","👨‍🏭","👩‍🏭","🧑‍💼","👨‍💼","👩‍💼","🧑‍🔬","👨‍🔬","👩‍🔬","🧑‍💻","👨‍💻","👩‍💻","🧑‍🎤","👨‍🎤","👩‍🎤","🧑‍🎨","👨‍🎨","👩‍🎨","🧑‍✈️","👨‍✈️","👩‍✈️","🧑‍🚀","👨‍🚀","👩‍🚀","🧑‍🚒","👨‍🚒","👩‍🚒","👮","👮‍♂️","👮‍♀️","🕵","🕵️‍♂️","🕵️‍♀️","💂","💂‍♂️","💂‍♀️","🥷","👷","👷‍♂️","👷‍♀️","🫅","🤴","👸","👳","👳‍♂️","👳‍♀️","👲","🧕","🤵","🤵‍♂️","🤵‍♀️","👰","👰‍♂️","👰‍♀️","🤰","🫃","🫄","🤱","👩‍🍼","👨‍🍼","🧑‍🍼","👼","🎅","🤶","🧑‍🎄","🦸","🦸‍♂️","🦸‍♀️","🦹","🦹‍♂️","🦹‍♀️","🧙","🧙‍♂️","🧙‍♀️","🧚","🧚‍♂️","🧚‍♀️","🧛","🧛‍♂️","🧛‍♀️","🧜","🧜‍♂️","🧜‍♀️","🧝","🧝‍♂️","🧝‍♀️","🧞","🧞‍♂️","🧞‍♀️","🧟","🧟‍♂️","🧟‍♀️","🧌","💆","💆‍♂️","💆‍♀️","💇","💇‍♂️","💇‍♀️","🚶","🚶‍♂️","🚶‍♀️","🚶‍➡️","🚶‍♀️‍➡️","🚶‍♂️‍➡️","🧍","🧍‍♂️","🧍‍♀️","🧎","🧎‍♂️","🧎‍♀️","🧎‍➡️","🧎‍♀️‍➡️","🧎‍♂️‍➡️","🧑‍🦯","🧑‍🦯‍➡️","👨‍🦯","👨‍🦯‍➡️","👩‍🦯","👩‍🦯‍➡️","🧑‍🦼","🧑‍🦼‍➡️","👨‍🦼","👨‍🦼‍➡️","👩‍🦼","👩‍🦼‍➡️","🧑‍🦽","🧑‍🦽‍➡️","👨‍🦽","👨‍🦽‍➡️","👩‍🦽","👩‍🦽‍➡️","🏃","🏃‍♂️","🏃‍♀️","🏃‍➡️","🏃‍♀️‍➡️","🏃‍♂️‍➡️","💃","🕺","🕴","👯","👯‍♂️","👯‍♀️","🧖","🧖‍♂️","🧖‍♀️","🧗","🧗‍♂️","🧗‍♀️","🤺","🏇","⛷","🏂","🏌","🏌️‍♂️","🏌️‍♀️","🏄","🏄‍♂️","🏄‍♀️","🚣","🚣‍♂️","🚣‍♀️","🏊","🏊‍♂️","🏊‍♀️","⛹","⛹️‍♂️","⛹️‍♀️","🏋","🏋️‍♂️","🏋️‍♀️","🚴","🚴‍♂️","🚴‍♀️","🚵","🚵‍♂️","🚵‍♀️","🤸","🤸‍♂️","🤸‍♀️","🤼","🤼‍♂️","🤼‍♀️","🤽","🤽‍♂️","🤽‍♀️","🤾","🤾‍♂️","🤾‍♀️","🤹","🤹‍♂️","🤹‍♀️","🧘","🧘‍♂️","🧘‍♀️","🛀","🛌","🧑‍🤝‍🧑","👭","👫","👬","💏","👩‍❤️‍💋‍👨","👨‍❤️‍💋‍👨","👩‍❤️‍💋‍👩","💑","👩‍❤️‍👨","👨‍❤️‍👨","👩‍❤️‍👩","👨‍👩‍👦","👨‍👩‍👧","👨‍👩‍👧‍👦","👨‍👩‍👦‍👦","👨‍👩‍👧‍👧","👨‍👨‍👦","👨‍👨‍👧","👨‍👨‍👧‍👦","👨‍👨‍👦‍👦","👨‍👨‍👧‍👧","👩‍👩‍👦","👩‍👩‍👧","👩‍👩‍👧‍👦","👩‍👩‍👦‍👦","👩‍👩‍👧‍👧","👨‍👦","👨‍👦‍👦","👨‍👧","👨‍👧‍👦","👨‍👧‍👧","👩‍👦","👩‍👦‍👦","👩‍👧","👩‍👧‍👦","👩‍👧‍👧","🗣","👤","👥","🫂","👪","🧑‍🧑‍🧒","🧑‍🧑‍🧒‍🧒","🧑‍🧒","🧑‍🧒‍🧒","👣","🫆","🦰","🦱","🦳","🦲","🐵","🐒","🦍","🦧","🐶","🐕","🦮","🐕‍🦺","🐩","🐺","🦊","🦝","🐱","🐈","🐈‍⬛","🦁","🐯","🐅","🐆","🐴","🫎","🫏","🐎","🦄","🦓","🦌","🦬","🐮","🐂","🐃","🐄","🐷","🐖","🐗","🐽","🐏","🐑","🐐","🐪","🐫","🦙","🦒","🐘","🦣","🦏","🦛","🐭","🐁","🐀","🐹","🐰","🐇","🐿","🦫","🦔","🦇","🐻","🐻‍❄️","🐨","🐼","🦥","🦦","🦨","🦘","🦡","🐾","🦃","🐔","🐓","🐣","🐤","🐥","🐦","🐧","🕊","🦅","🦆","🦢","🦉","🦤","🪶","🦩","🦚","🦜","🪽","🐦‍⬛","🪿","🐦‍🔥","🐸","🐊","🐢","🦎","🐍","🐲","🐉","🦕","🦖","🐳","🐋","🐬","🦭","🐟","🐠","🐡","🦈","🐙","🐚","🪸","🪼","🦀","🦞","🦐","🦑","🦪","🐌","🦋","🐛","🐜","🐝","🪲","🐞","🦗","🪳","🕷","🕸","🦂","🦟","🪰","🪱","🦠","💐","🌸","💮","🪷","🏵","🌹","🥀","🌺","🌻","🌼","🌷","🪻","🌱","🪴","🌲","🌳","🌴","🌵","🌾","🌿","☘","🍀","🍁","🍂","🍃","🪹","🪺","🍄","🪾","🍇","🍈","🍉","🍊","🍋","🍋‍🟩","🍌","🍍","🥭","🍎","🍏","🍐","🍑","🍒","🍓","🫐","🥝","🍅","🫒","🥥","🥑","🍆","🥔","🥕","🌽","🌶","🫑","🥒","🥬","🥦","🧄","🧅","🥜","🫘","🌰","🫚","🫛","🍄‍🟫","🫜","🍞","🥐","🥖","🫓","🥨","🥯","🥞","🧇","🧀","🍖","🍗","🥩","🥓","🍔","🍟","🍕","🌭","🥪","🌮","🌯","🫔","🥙","🧆","🥚","🍳","🥘","🍲","🫕","🥣","🥗","🍿","🧈","🧂","🥫","🍱","🍘","🍙","🍚","🍛","🍜","🍝","🍠","🍢","🍣","🍤","🍥","🥮","🍡","🥟","🥠","🥡","🍦","🍧","🍨","🍩","🍪","🎂","🍰","🧁","🥧","🍫","🍬","🍭","🍮","🍯","🍼","🥛","☕","🫖","🍵","🍶","🍾","🍷","🍸","🍹","🍺","🍻","🥂","🥃","🫗","🥤","🧋","🧃","🧉","🧊","🥢","🍽","🍴","🥄","🔪","🫙","🏺","🌍","🌎","🌏","🌐","🗺","🗾","🧭","🏔","⛰","🌋","🗻","🏕","🏖","🏜","🏝","🏞","🏟","🏛","🏗","🧱","🪨","🪵","🛖","🏘","🏚","🏠","🏡","🏢","🏣","🏤","🏥","🏦","🏨","🏩","🏪","🏫","🏬","🏭","🏯","🏰","💒","🗼","🗽","⛪","🕌","🛕","🕍","⛩","🕋","⛲","⛺","🌁","🌃","🏙","🌄","🌅","🌆","🌇","🌉","♨","🎠","🛝","🎡","🎢","💈","🎪","🚂","🚃","🚄","🚅","🚆","🚇","🚈","🚉","🚊","🚝","🚞","🚋","🚌","🚍","🚎","🚐","🚑","🚒","🚓","🚔","🚕","🚖","🚗","🚘","🚙","🛻","🚚","🚛","🚜","🏎","🏍","🛵","🦽","🦼","🛺","🚲","🛴","🛹","🛼","🚏","🛣","🛤","🛢","⛽","🛞","🚨","🚥","🚦","🛑","🚧","⚓","🛟","⛵","🛶","🚤","🛳","⛴","🛥","🚢","✈","🛩","🛫","🛬","🪂","💺","🚁","🚟","🚠","🚡","🛰","🚀","🛸","🛎","🧳","⌛","⏳","⌚","⏰","⏱","⏲","🕰","🕛","🕧","🕐","🕜","🕑","🕝","🕒","🕞","🕓","🕟","🕔","🕠","🕕","🕡","🕖","🕢","🕗","🕣","🕘","🕤","🕙","🕥","🕚","🕦","🌑","🌒","🌓","🌔","🌕","🌖","🌗","🌘","🌙","🌚","🌛","🌜","🌡","☀","🌝","🌞","🪐","⭐","🌟","🌠","🌌","☁","⛅","⛈","🌤","🌥","🌦","🌧","🌨","🌩","🌪","🌫","🌬","🌀","🌈","🌂","☂","☔","⛱","⚡","❄","☃","⛄","☄","🔥","💧","🌊","🎃","🎄","🎆","🎇","🧨","✨","🎈","🎉","🎊","🎋","🎍","🎎","🎏","🎐","🎑","🧧","🎀","🎁","🎗","🎟","🎫","🎖","🏆","🏅","🥇","🥈","🥉","⚽","⚾","🥎","🏀","🏐","🏈","🏉","🎾","🥏","🎳","🏏","🏑","🏒","🥍","🏓","🏸","🥊","🥋","🥅","⛳","⛸","🎣","🤿","🎽","🎿","🛷","🥌","🎯","🪀","🪁","🔫","🎱","🔮","🪄","🎮","🕹","🎰","🎲","🧩","🧸","🪅","🪩","🪆","♠","♥","♦","♣","♟","🃏","🀄","🎴","🎭","🖼","🎨","🧵","🪡","🧶","🪢","👓","🕶","🥽","🥼","🦺","👔","👕","👖","🧣","🧤","🧥","🧦","👗","👘","🥻","🩱","🩲","🩳","👙","👚","🪭","👛","👜","👝","🛍","🎒","🩴","👞","👟","🥾","🥿","👠","👡","🩰","👢","🪮","👑","👒","🎩","🎓","🧢","🪖","⛑","📿","💄","💍","💎","🔇","🔈","🔉","🔊","📢","📣","📯","🔔","🔕","🎼","🎵","🎶","🎙","🎚","🎛","🎤","🎧","📻","🎷","🪗","🎸","🎹","🎺","🎻","🪕","🥁","🪘","🪇","🪈","🪉","📱","📲","☎","📞","📟","📠","🔋","🪫","🔌","💻","🖥","🖨","⌨","🖱","🖲","💽","💾","💿","📀","🧮","🎥","🎞","📽","🎬","📺","📷","📸","📹","📼","🔍","🔎","🕯","💡","🔦","🏮","🪔","📔","📕","📖","📗","📘","📙","📚","📓","📒","📃","📜","📄","📰","🗞","📑","🔖","🏷","💰","🪙","💴","💵","💶","💷","💸","💳","🧾","💹","✉","📧","📨","📩","📤","📥","📦","📫","📪","📬","📭","📮","🗳","✏","✒","🖋","🖊","🖌","🖍","📝","💼","📁","📂","🗂","📅","📆","🗒","🗓","📇","📈","📉","📊","📋","📌","📍","📎","🖇","📏","📐","✂","🗃","🗄","🗑","🔒","🔓","🔏","🔐","🔑","🗝","🔨","🪓","⛏","⚒","🛠","🗡","⚔","💣","🪃","🏹","🛡","🪚","🔧","🪛","🔩","⚙","🗜","⚖","🦯","🔗","⛓️‍💥","⛓","🪝","🧰","🧲","🪜","🪏","⚗","🧪","🧫","🧬","🔬","🔭","📡","💉","🩸","💊","🩹","🩼","🩺","🩻","🚪","🛗","🪞","🪟","🛏","🛋","🪑","🚽","🪠","🚿","🛁","🪤","🪒","🧴","🧷","🧹","🧺","🧻","🪣","🧼","🫧","🪥","🧽","🧯","🛒","🚬","⚰","🪦","⚱","🧿","🪬","🗿","🪧","🪪","🏧","🚮","🚰","♿","🚹","🚺","🚻","🚼","🚾","🛂","🛃","🛄","🛅","⚠","🚸","⛔","🚫","🚳","🚭","🚯","🚱","🚷","📵","🔞","☢","☣","⬆","↗","➡","↘","⬇","↙","⬅","↖","↕","↔","↩","↪","⤴","⤵","🔃","🔚","🔛","🔝","🛐","⚛","🕉","✡","☸","☯","✝","☦","☪","☮","🕎","🔯","🪯","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎","🔀","🔂","▶","⏭","⏯","◀","⏮","🔼","⏫","🔽","⏬","⏸","⏹","⏺","⏏","🎦","🔅","🔆","📶","🛜","📳","📴","♀","♂","⚧","✖","➕","➖","➗","🟰","♾","‼","⁉","❓","❔","❕","❗","〰","💱","💲","⚕","♻","⚜","🔱","📛","🔰","⭕","✅","☑","✔","❌","❎","➰","➿","〽","✳","✴","❇","©","®","™","🫟","#️⃣","*️⃣","0️⃣","1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣","🔟","🔠","🔡","🔢","🔣","🔤","🅰","🆎","🅱","🆑","🆒","🆓","ℹ","🆔","Ⓜ","🆕","🆖","🅾","🆗","🅿","🆘","🆙","🆚","🈁","🈂","🈷","🈶","🈯","🉐","🈹","🈚","🈲","🉑","🈸","🈴","🈳","㊗","㊙","🈺","🈵","🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪","🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛","⬜","◼","◻","◾","◽","▪","▫","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘","🔳","🔲","🏁","🚩","🎌","🏴","🏳"];
  /** @type {string[]} */
  static get emojiControllers() {
    return [].concat(...Object.values(this.EMOJI_CONTROL));
  }
  /** @type {string[]} */
  static get emojiControllersKey() {
    return [].concat(...Object.keys(this.EMOJI_CONTROL).map(s => s + "Amount"));
  }
  /** @type {string[]} */
  static get variantSelectors() {
    /** @type {string[]} */
    const basicVariantSelectors = [];
    for (let i = 0xFE00; i <= 0xFE0F; ++i) {
      basicVariantSelectors.push(String.fromCodePoint(i));
    }
    return basicVariantSelectors;
    // extendedVariantSelectors has width and we want the zero-width selectors
  }

  /**
   * @template T
   * @param {T[]} array
   * @param {number} [amount] the amount of cherry-picked elements
   * @returns {T[]} cherry-picked array
   */
  static #randomCherryPick(array, amount) {
    if (amount === undefined || amount === null || amount > array.length) {
      amount = array.length;
    }
    const candidates = [...array];
    /** @type {T[]} */
    const results = [];
    for (let i = 0; i < amount; ++i) {
      const k = Math.floor(Math.random() * candidates.length);
      results.push(candidates[k]);
      candidates.splice(k, 1);
    }
    return results;
  }

  /**
   * @template T
   * @param {T[]} array
   * @returns {T[]} shuffled array
   */
  static #shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Function name starts with '#' is the private function in JS

  /**
   * Checks whether a text contains emojis, if exists then return true otherwise
   * return false
   * @param {string} text
   * @returns {boolean}
   */
  static hasEmoji(text) {
    const emojiList = text.match(this.EMOJI_REGEX);
    return emojiList !== null;
  }

  /**
   * Return the emojis list in text
   * @param {string} text
   * @returns {string[]}
   */
  static getEmojiList(text) {
    const emojiList = text.match(this.EMOJI_REGEX);
    return emojiList ?? [];
  }

  /**
   * Return the emojis list in text
   * @param {string} plaintext
   * @param {string} hiddenText
   * @param {number} emojiAmount
   * @param { {[K in `${keyof typeof this.EMOJI_CONTROL}Amount`]?: number} } [controllers]
   * @returns {string[]}
   */
  static encodeWithRandom(
    plaintext,
    hiddenText,
    emojiAmount,
    controllers,
  ) {
    if (typeof plaintext !== "string" || typeof hiddenText !== "string") {
      throw new TypeError("Type of `plaintext` and `hiddenText` must be string.");
    }
    if (typeof emojiAmount !== "number") {
      throw new TypeError("Type of `emojiAmount` must be number.");
    }
    if (emojiAmount <= 0) {
      throw new RangeError("`emojiAmount` must be a positive number.");
    }
    for (const key in controllers) {
      if (!this.emojiControllersKey.includes(key)) {
        throw new TypeError(`Parameter \`controllers\` shouldn't have key \`${key}\``);
      }
    }

    const encoder = new TextEncoder();
    const bytes = encoder.encode(hiddenText);
    /** @type {string[]} */
    let emojiCarriers = [];

    emojiCarriers = [
      ...this.#randomCherryPick(this.EMOJI_NORMAL, emojiAmount)
    ];

    // This step will generate controller emojis
    for (const key in controllers) {
      if (controllers[key]) {
        const controllersKey = key.slice(0, key.indexOf("Amount"));
        /** @type {number} */
        let t = controllers[key] ?? 0;
        /** @type {number} */
        const p = this.EMOJI_CONTROL[controllersKey].length;

        while (t >= p) {
          emojiCarriers = [...emojiCarriers,
            ...this.#randomCherryPick(
              this.EMOJI_CONTROL[controllersKey],
              p
            ),
          ];
          t -= p;
        }
        emojiCarriers = [...emojiCarriers,
          ...this.#randomCherryPick(
            this.EMOJI_CONTROL[controllersKey],
            t
          ),
        ];
      }
    }

    emojiCarriers = this.#shuffle(emojiCarriers);

    if (emojiCarriers.length === 0) {
      throw new Error("No emoji carriers available");
    }

    // Calculating chunk size ensuing at least 1 byte variant selectors per emoji
    const chunkSize = Math.ceil(bytes.length * 2 / emojiCarriers.length);
    for (let i = 0; i < bytes.length * 2; i += chunkSize) {
      const index = Math.floor(i / chunkSize);
      const currentEmoji = emojiCarriers[index];
      /** @type {number[]} */
      const variantSelectorCodepoints = [];

      for (let j = 0; j < chunkSize; ++j) {
        const byte = bytes[i + j];
        const high4 = (byte & 0b11110000) >> 4;
        const low4  = (byte & 0b00001111);

        variantSelectorCodepoints.push(high4);
        variantSelectorCodepoints.push(low4);
      }

      emojiCarriers[index] += "\uFE0F";
      // Use `\uFE0F` as a splitter between emoji and hidden text

      if (!this.emojiControllers.includes(currentEmoji)) {
        for (const part of variantSelectorCodepoints) {
          emojiCarriers[index] += this.variantSelectors[part];
        }
      } else {
        if (this.EMOJI_CONTROL.step1Right.includes(currentEmoji)) {
          for (const part of variantSelectorCodepoints) {
            emojiCarriers[index] += this.variantSelectors[part];
          }
          // step1Right is same with writing 4 bits from left to right
          //
          // [ \uFE0F, \uFE03 , ..., \uFE08 ]
          //     ↑      ↑
          //     0      1

        } else if (this.EMOJI_CONTROL.step2Right.includes(currentEmoji)) {
          for (const part of variantSelectorCodepoints) {
            const filler = this.variantSelectors[
              Math.floor(Math.random() * this.variantSelectors.length)
            ];
            emojiCarriers[index] += (this.variantSelectors[part] + filler);
          }
          // step2Right is same with writing 4 bits from left to right step 2
          // and 4 bits random variant selector fills the gap.
          //
          // [ \uFE0F, \uFE03 , \uFE07, ..., \uFE08 ]
          //     ↑      ↑         ↑
          //     0   <filler>     1

        } else if (this.EMOJI_CONTROL.step1Left.includes(currentEmoji)) {
          for (let i = variantSelectorCodepoints.length - 1; i >= 0; i--) {
            emojiCarriers[index] += this.variantSelectors[
              variantSelectorCodepoints[i]
            ];
          }
          // step1Left is same with writing 4 bits from right to left.
          //
          // [ \uFE0F, \uFE03 , ..., \uFE08, \uFE05 ]
          //                            ↑       ↑
          //                            1       0

        } else if (this.EMOJI_CONTROL.step2Left.includes(currentEmoji)) {
          for (let i = variantSelectorCodepoints.length - 1; i >= 0; i--) {
            const filler = this.variantSelectors[
              Math.floor(Math.random() * this.variantSelectors.length)
            ];
            emojiCarriers[index] += (this.variantSelectors[
              variantSelectorCodepoints[i]
            ] + filler);
          }
          // step2Left is same with writing 4 bits from right to left step 2
          // and 4 bits random variant selector fills the gap
          //
          // [ \uFE0F, \uFE03 , ..., \uFE0A \uFE08, \uFE05 ]
          //                            ↑      ↑       ↑
          //                            1   <filler>   0

        } else if (this.EMOJI_CONTROL.stepZigRight.includes(currentEmoji)) {
          for (let i = 1; i <= variantSelectorCodepoints.length - 1; i += 2) {
            emojiCarriers[index] += (
              this.variantSelectors[variantSelectorCodepoints[i]] +
              this.variantSelectors[variantSelectorCodepoints[i - 1]]
            );
          }
          // stepZigRight writes the codepoint zig-zag from index 1 → 0, 3 → 2 etc.
          //
          // [ \uFE0F, \uFE03, \uFE0A, \uFE01, ... ]
          //     ↑        ↑      ↑       ↑
          //     1        0      3       2

        } else if (this.EMOJI_CONTROL.stepZigLeft.includes(currentEmoji)) {
          for (let i = variantSelectorCodepoints.length - 2; i >= 0; i -= 2) {
            emojiCarriers[index] += (
              this.variantSelectors[variantSelectorCodepoints[i]] +
              this.variantSelectors[variantSelectorCodepoints[i + 1]]
            );
          }
          // stepZigRight writes the codepoint zig-zag from index length - 2
          // → length - 1, length - 4 → length - 3 etc.
          //
          // [ ..., \uFE0F, \uFE03, \uFE0A, \uFE01]
          //           ↑        ↑      ↑       ↑
          //           2        3      0       1

        }
      }
    }

    let encodedTextList = plaintext.split("");
    let lastInsertedPos = 0;
    emojiCarriers.forEach((encodedEmoji) => {
      const minPos = lastInsertedPos;
      const maxPos = encodedTextList.length;
      const randomPos = Math.floor(Math.random() * (maxPos - minPos + 1)) + minPos;
      encodedTextList.splice(randomPos, 0, encodedEmoji);
    });

    return encodedTextList.join("");
  }
}

/**
 * @param {InputEvent} e
 */
function handleInputChange(e) {
  /** @type {string} */
  const id = e.target.id;
  /** @type {HTMLLabelElement} */
  const _elementShow = document.querySelector(`label.input-show#${id}-show`);
  _elementShow.innerText = e.target.value;
}

function handleEncode() {
  /** @type {HTMLTextAreaElement} */
  const _elementEmojiCarriers = document.querySelector("#emoji-carrier");
  /** @type {HTMLTextAreaElement} */
  const _elementPlaintext = document.querySelector("#plaintext");
  /** @type {HTMLTextAreaElement} */
  const _elementHiddenText = document.querySelector("#hidden-text");
  /** @type {HTMLTextAreaElement} */
  const _elementEncodedOutput = document.querySelector("#encoded-output");
  /** @type {HTMLInputElement} */
  const _elementEmojiAmountInput = document.querySelector("input#emoji-amount");
  /** @type {HTMLInputElement} */
  const _elementStep1RightInput = document.querySelector("input#step-1-right-amount");
  /** @type {HTMLInputElement} */
  const _elementStep2RightInput = document.querySelector("input#step-2-right-amount");
  /** @type {HTMLInputElement} */
  const _elementStep1LeftInput = document.querySelector("input#step-1-left-amount");
  /** @type {HTMLInputElement} */
  const _elementStep2LeftInput = document.querySelector("input#step-2-left-amount");
  /** @type {HTMLInputElement} */
  const _elementStepZigRightInput = document.querySelector("input#step-zig-right-amount");
  /** @type {HTMLInputElement} */
  const _elementStepZigLeftInput = document.querySelector("input#step-zig-left-amount");

  const emojiCarriers = _elementEmojiCarriers.value;
  const plaintext = _elementPlaintext.value;
  const hiddenText = _elementHiddenText.value;
  const emojiAmount         = parseInt(_elementEmojiAmountInput.value);
  const step1RightAmount    = parseInt(_elementStep1RightInput.value);
  const step2RightAmount    = parseInt(_elementStep2RightInput.value);
  const step1LeftAmount     = parseInt(_elementStep1LeftInput.value);
  const step2LeftAmount     = parseInt(_elementStep2LeftInput.value);
  const stepZigRightAmount  = parseInt(_elementStepZigRightInput.value);
  const stepZigLeftAmount   = parseInt(_elementStepZigLeftInput.value);

  const checkEmojiCarriers = EmojiSteganography.hasEmoji(emojiCarriers);
  const checkPlaintext = EmojiSteganography.hasEmoji(plaintext);

  if (checkEmojiCarriers && checkPlaintext) {
    alert("At most one of input 'Emoji Carrier' and 'Plaintext' should contain emoji!");
    return;
  } else if (!checkEmojiCarriers && !checkPlaintext) {
    // When no emoji carriers and there is no emoji in plaintext, generate randomly
    _elementEncodedOutput.value = EmojiSteganography.encodeWithRandom(
      plaintext,
      hiddenText,
      emojiAmount,
      {
        step1RightAmount: step1RightAmount,
        step2RightAmount: step2RightAmount,
        step1LeftAmount: step1LeftAmount,
        step2LeftAmount: step2LeftAmount,
        stepZigRightAmount: stepZigRightAmount,
        stepZigLeftAmount: stepZigLeftAmount
      }
    );
  } else if (!checkEmojiCarriers && checkPlaintext) {
    // When no emoji carriers and there are emojis in plaintext, use plaintext
    const emojis = EmojiSteganography.getEmojiList(plaintext);
  }

}

const emojiRangeIDs = [
  "emoji-amount",
  "step-1-right-amount",
  "step-2-right-amount",
  "step-1-left-amount",
  "step-2-left-amount",
  "step-zig-right-amount",
  "step-zig-left-amount"
];

for (const id of emojiRangeIDs) {
  /** @type {HTMLInputElement} */
  const input = document.querySelector(`input#${id}`);
  input.addEventListener("input", (e) => handleInputChange(e));
}