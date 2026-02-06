// ===================================================================
// SIMPLE EXIF WRITER - Offline-fähige IPTC/EXIF Metadaten
// ===================================================================

class SimpleExifWriter {
  constructor() {
    this.EXIF_MARKER = 0xFFE1;
    this.EXIF_HEADER = "Exif\0\0";
  }

  addExifToJpeg(imageArrayBuffer, metadata) {
    try {
      const view = new DataView(imageArrayBuffer);

      if (view.getUint16(0) !== 0xFFD8) {
        console.warn('Not a valid JPEG file');
        return null;
      }

      const exifSegment = this.createExifSegment(metadata);
      return this.insertExifSegment(imageArrayBuffer, exifSegment);
    } catch (error) {
      console.error('Error adding EXIF data:', error);
      return null;
    }
  }

  createExifSegment(metadata) {
    const ifd0Entries = this.createIFD0Entries(metadata);
    const tiffData = this.createTiffData(ifd0Entries);
    const exifData = this.stringToBytes(this.EXIF_HEADER).concat(tiffData);

    const segmentLength = exifData.length + 2;
    const segment = [
      (this.EXIF_MARKER >> 8) & 0xFF,
      this.EXIF_MARKER & 0xFF,
      (segmentLength >> 8) & 0xFF,
      segmentLength & 0xFF
    ].concat(exifData);

    return new Uint8Array(segment);
  }

  createIFD0Entries(metadata) {
    const entries = [];

    if (metadata.description) {
      entries.push({
        tag: 0x010E, // ImageDescription
        type: 2,
        count: metadata.description.length + 1,
        value: metadata.description + '\0'
      });
    }

    if (metadata.make) {
      entries.push({
        tag: 0x010F, // Make
        type: 2,
        count: metadata.make.length + 1,
        value: metadata.make + '\0'
      });
    }

    if (metadata.model) {
      entries.push({
        tag: 0x0110, // Model
        type: 2,
        count: metadata.model.length + 1,
        value: metadata.model + '\0'
      });
    }

    if (metadata.software) {
      entries.push({
        tag: 0x0131, // Software
        type: 2,
        count: metadata.software.length + 1,
        value: metadata.software + '\0'
      });
    }

    return entries;
  }

  createTiffData(entries) {
    const header = [0x4D, 0x4D, 0x00, 0x2A, 0x00, 0x00, 0x00, 0x08];
    const entryCount = [(entries.length >> 8) & 0xFF, entries.length & 0xFF];

    let dataOffset = 8 + 2 + (entries.length * 12) + 4;
    const ifdEntries = [];
    const ifdData = [];

    entries.forEach(entry => {
      const ifdEntry = [
        (entry.tag >> 8) & 0xFF, entry.tag & 0xFF,
        (entry.type >> 8) & 0xFF, entry.type & 0xFF,
        (entry.count >> 24) & 0xFF, (entry.count >> 16) & 0xFF,
        (entry.count >> 8) & 0xFF, entry.count & 0xFF
      ];

      if (typeof entry.value === 'string' && entry.value.length > 4) {
        ifdEntry.push(
          (dataOffset >> 24) & 0xFF, (dataOffset >> 16) & 0xFF,
          (dataOffset >> 8) & 0xFF, dataOffset & 0xFF
        );

        const valueBytes = this.stringToBytes(entry.value);
        ifdData.push(...valueBytes);
        dataOffset += valueBytes.length;

        if (valueBytes.length % 2 === 1) {
          ifdData.push(0);
          dataOffset++;
        }
      } else {
        const valueBytes = this.stringToBytes(entry.value).slice(0, 4);
        while (valueBytes.length < 4) valueBytes.push(0);
        ifdEntry.push(...valueBytes);
      }

      ifdEntries.push(...ifdEntry);
    });

    const nextIfd = [0x00, 0x00, 0x00, 0x00];
    return header.concat(entryCount, ifdEntries, nextIfd, ifdData);
  }

  insertExifSegment(imageBuffer, exifSegment) {
    const result = new Uint8Array(imageBuffer.byteLength + exifSegment.length);
    const view = new DataView(imageBuffer);

    result[0] = view.getUint8(0);
    result[1] = view.getUint8(1);
    result.set(exifSegment, 2);

    const remaining = new Uint8Array(imageBuffer, 2);
    result.set(remaining, 2 + exifSegment.length);

    return result.buffer;
  }

  stringToBytes(str) {
    return str.split('').map(char => char.charCodeAt(0));
  }

  addMetadata(imageArrayBuffer, shooterInfo) {
    const metadata = {
      description: `${shooterInfo.name} ${shooterInfo.currentDiscipline} ${shooterInfo.discipline}`,
      make: "Rundenkampf App",
      model: "Scheibenerfassung",
      software: `Rundenkampf App v${typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'Unknown'}`,
      keywords: [
        shooterInfo.shooterName,
        shooterInfo.discipline,
        shooterInfo.team || "Einzelschütze",
        shooterInfo.competitionType,
        "Rundenkampf",
        "Schießsport"
      ].filter(Boolean).join(", ")
    };

    return this.addExifToJpeg(imageArrayBuffer, metadata);
  }
}

const exifWriter = new SimpleExifWriter();