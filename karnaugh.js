class karnaugh {
    MaxLength = 4;
    MaxNumber = 16;                         // 2 ^ MaxLength
    chars = ["A", "B", "C", "D", "E", "F"]; // chars.length = MaxLength

    // Input:  Binary Code (String)
    // Output: Number of 1's in binary code (Number)
    bitNum(bits) {
        let n = 0;
        for (let i = 0; i < bits.length; i ++) {
            if (bits[i] == "1") n += 1;
        }
        return n;
    }

    // Input:  Decimal(Number)
    // Output: binary code(String)
    binaryify(m) {
        let i = this.MaxNumber;
        let str = "";
        while (i >>= 1) {
            if (m & i) str += "1";
            else str += "0";
        }
        return str;
    }

    // Input:  binary code(String)
    // Output: Decimal(Number)
    decimalify(bits) {
        let n = this.MaxNumber;
        let i = 0;
        let ans = 0;
        while (n >>= 1) {
            if (bits[i] == 1)
                ans += n;
            i += 1;
        }
        return ans;
    }

    // Input:  Binary code with "-" (String)
    // Output: Boolean monomal Text Formula (String)
    termify(bits) {
        let index = 0;
        let str = "";
        for (let i = 0; i < bits.length; i ++) {
            if (bits[i] == "0") str += "\\bar ";
            if (bits[i] != "-") str += this.chars[index];
            index += 1;
        }
        return str.length ? str : "1";
    }
    termify_POS(bits) {
        let index = 0;
        let str = "";
        for (let i = 0; i < bits.length; i ++) {
            if (str.length && bits[i] != "-") str += "+";
            if (bits[i] == "1") str += "\\bar ";
            if (bits[i] != "-") str += this.chars[index];
            index += 1;
        }
        return str.length ? `(${str})` : "0";
    }

    // Input:  A Decimal array containing all the smallest (String)
    // Output: Terms contained (Number[])
    minimumTermify(bits) {
        if (bits.length == 0) return [];
        let terms = [""];
        let termsTemp = new Array();
        for (let i = 0; i < bits.length; i ++) {
            if (bits[i] == "-") terms.forEach(u => {
                termsTemp.push(u + "1");
                termsTemp.push(u + "0");
            });
            else terms.forEach(u => {
                termsTemp.push(u + bits[i]);
            });
            terms = termsTemp;
            termsTemp = new Array();
        }
        return terms.map(u => this.decimalify(u));
    }

    // Attempt to merge u and v, return an empty string indicating that the merge failed
    // Input:  Contains "-" binary code (String)
    // Return: Contains "-" binary code (String)
    merge(u, v) {
        let flag = false;
        let str = "";
        for (let i = 0; i < u.length; i ++) {
            if (u[i] != v[i])
                if (flag) return false;
                else {
                    flag = true;
                    str += "-";
                }
            else str += u[i];
        }
        return str;
    }

    // 用 Quine-McCluskey Algorithm Simplifies Several Minimal Terms
    // Input:  Decimal array (Number[])
    // Return: Array of binary codes with "-" (String[])
    simplify(ones, dontcares) {
        let group = new Array();
        let groupTemp = new Array();
        for (let i = 0; i <= this.MaxLength; i ++) {
            group[i] = new Map();
            groupTemp[i] = new Map();
        }
        let result = new Set();
        ones.forEach(num => {
            let bits = this.binaryify(num);
            group[this.bitNum(bits)].set(bits, false);
        });
        dontcares.forEach(num => { // Irrelevant items also participate in merging, but do not participate in subsequent prime item table simplification

            let bits = this.binaryify(num);
            group[this.bitNum(bits)].set(bits, false);
        });
        while (true) {
            let hasMerged = false;
            // Attempt to merge two items of adjacent groups
            for (let i = 0; i < this.MaxLength; i ++)
                for (let u of group[i])
                    for (let v of group[i + 1]) {
                        let merged = this.merge(u[0], v[0]);
                        if (merged) {
                            hasMerged = true;
                            groupTemp[this.bitNum(merged)].set(merged, false);
                            group[i].set(u[0], true);
                            group[i + 1].set(v[0], true);
                        }
                    }
            // Add unmarked "prime implicants" to the result list
            for (let i = 0; i <= this.MaxLength; i ++)
                for (let u of group[i])
                    if (u[1] == false)
                        result.add(u[0]);
            // If the merge is unsuccessful, the loop ends
            if (!hasMerged) break;

            group = groupTemp;
            groupTemp = new Array();
            for (let i = 0; i <= this.MaxLength; i ++)
                groupTemp[i] = new Map();
        }
        return Array.from(result);
    }

    // Further simplification using prime table
    simplify_prime(ones, dontcares) {
        let result = this.simplify(ones, dontcares);
        let simplifiedResult = new Array();

        let gcols = new Set(); // set of columns, g for "global"
        let rowsOfCol = new Array();
        let colsOfRow = new Map();
        ones.forEach(col => {
            gcols.add(col);
            rowsOfCol[col] = new Array();
        });
        result.forEach(row => {
            let cols = this.minimumTermify(row);
            let reducedCols = new Array(); // Minimum item only on one line
            cols.forEach(col => {
                if (!dontcares.has(col)) { //Irrelevant items do not participate in prime item table simplification
                    rowsOfCol[col].push(row);
                    reducedCols.push(col);
                }
            });
            if (reducedCols.length)
                colsOfRow.set(row, reducedCols);
        });

        // Preliminary determination of prime items
        rowsOfCol.forEach(row => {
            if (row.length == 1 && colsOfRow.get(row[0])) { //prime term
                simplifiedResult.push(row[0]); // join final result
                colsOfRow.get(row[0]).forEach(col => {
                    if (gcols.has(col)) {
                        gcols.delete(col);
                        rowsOfCol[col] = new Array(); //Remove all the smallest items contained in this item
                    }
                });
                colsOfRow.delete(row[0]);
            }
        });

        while (gcols.size > 0) {
            let max = 0;
            let rowOfMax = 0;
            // Find the implicant with the most minimal terms
            colsOfRow.forEach((cols, row) => {
                let length = 0;
                cols.forEach(col => {
                    if (gcols.has(col))
                        length += 1;
                });
                if (length > max) {
                    max = length;
                    rowOfMax = row;
                }
            });
            if (max == 0) break;
            simplifiedResult.push(rowOfMax);
            colsOfRow.get(rowOfMax).forEach(col => {
                if (gcols.has(col)) {
                    gcols.delete(col);
                    rowsOfCol[col] = new Array();
                }
            });
            colsOfRow.delete(rowOfMax);
        }
        return simplifiedResult.length ? simplifiedResult : result;
    }
}